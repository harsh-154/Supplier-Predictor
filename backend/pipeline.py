from pathlib import Path
import pandas as pd
import joblib
from xgboost import XGBClassifier
from math import radians, sin, cos, sqrt, atan2
import requests
import os
from dotenv import load_dotenv
import random # Added for introducing randomness

load_dotenv()

OPENWEATHER_API = os.getenv("OPENWEATHER_API")
ACLED_API_TOKEN = os.getenv("ACLED_API_KEY")

# Define paths (adjusted to current working directory)
RAW_CSV = Path("data/updated_supplier_dataset.csv")
PROCESSED_CSV = Path("processed/supplier_dataset_with_risk.csv")
MODEL_PATH = Path("models/supplier_failure_xgb.pkl")
WAREHOUSES_CSV = Path("data/warehouses.csv")

# Ensure directories exist
Path("processed").mkdir(parents=True, exist_ok=True)
Path("data").mkdir(parents=True, exist_ok=True)
Path("models").mkdir(parents=True, exist_ok=True)

# Define FEATURES globally
# These names should now directly match the CSV header after necessary renames
FEATURES = ["LeadTimeDays", "PastReliability", "Capacity", "WeatherRisk", "WarRisk"]

# Embedded functions from utils.py
def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Radius of Earth in kilometers
    lat1_rad = radians(lat1)
    lon1_rad = radians(lon1)
    lat2_rad = radians(lat2)
    lon2_rad = radians(lon2)

    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad

    a = sin(dlat / 2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    distance = R * c
    return distance

def fetch_weather_risk(lat, lon):
    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHER_API}"
        res = requests.get(url).json()
        main = res['weather'][0]['main']
        if main in ["Thunderstorm", "Extreme", "Tornado"]:
            return 0.95 # Slightly increased
        elif main in ["Rain", "Snow"]:
            return 0.7 # Increased from 0.6
        elif main == "Clouds":
            return 0.5 # Increased from 0.4
        else:
            return 0.3 # Increased from 0.2
    except Exception as e:
        print(f"Error fetching weather risk: {e}. Returning random fallback.")
        # Increased range for random fallback to ensure higher variability and general level
        return round(random.uniform(0.6, 0.9), 1)

def fetch_war_risk(country):
    try:
        url = f"https://api.acleddata.com/acled/read?country={country}&event_date=LAST30DAYS&limit=1"
        headers = {"Authorization": f"Token {ACLED_API_TOKEN}"}
        res = requests.get(url, headers=headers).json()
        count = int(res.get("count", 0))
        # MODIFIED: New logic for war risk to ensure more variability and less capping at 1.0
        # Each event contributes 0.05 to the risk, plus a small random component.
        # This spreads out the risk more over the number of events.
        war_risk_score = (count * 0.05) + random.uniform(0, 0.1)
        return min(1.0, war_risk_score) # Cap at 1.0
    except Exception as e:
        print(f"Error fetching war risk: {e}. Returning random fallback.")
        # Increased range for random fallback to ensure higher variability and general level
        return round(random.uniform(0.4, 0.8), 1)

# Embedded function from model.py
def train_model(df, model_path):
    # Ensure FEATURES list matches actual column names in df
    X = df[FEATURES]
    y = df["Failure"]

    model = XGBClassifier(eval_metric="logloss", base_score=0.5)
    
    model.fit(X, y)
    joblib.dump(model, model_path)
    return model

def run_pipeline():
    """
    Runs the data processing pipeline:
    1. Reads raw supplier data.
    2. Fetches external risk factors (weather, war).
    3. Calculates a 'Failure' target based on combined risks.
    4. Trains an XGBoost classifier model.
    5. Saves the processed data and the trained model.
    """
    if not RAW_CSV.exists():
        raise FileNotFoundError(f"❌ Raw dataset not found at {RAW_CSV}. Please ensure 'updated_supplier_dataset.csv' is in 'data/'.")

    df = pd.read_csv(RAW_CSV)

    # Renaming columns to match internal naming conventions
    df = df.rename(columns={
        "ProductName": "Product",
        "Product ID": "ProductID",
        "Supplier ID": "SupplierID",
        "Supplier Name": "SupplierName",
        "Product Category": "Category",
        "Supplier Latitude": "Latitude",
        "Supplier Longitude": "Longitude",
        "Supplier City": "City",
        "Supplier Country": "Country"
    })

    # Add small random noise to features to ensure variability for the model
    # Use the correct column names from the CSV: LeadTimeDays, PastReliability
    df["LeadTimeDays"] = df["LeadTimeDays"] + df["LeadTimeDays"].apply(lambda x: random.uniform(-0.5, 0.5))
    df["PastReliability"] = df["PastReliability"] + df["PastReliability"].apply(lambda x: random.uniform(-0.02, 0.02))
    df["Capacity"] = df["Capacity"] + df["Capacity"].apply(lambda x: random.uniform(-5, 5))

    # Clamp values to reasonable ranges after adding noise
    df["LeadTimeDays"] = df["LeadTimeDays"].clip(lower=1)
    df["PastReliability"] = df["PastReliability"].clip(lower=0.7, upper=1.0) # Keep reliability generally high
    df["Capacity"] = df["Capacity"].clip(lower=100)

    # Fetch Weather Risk
    df["WeatherRisk"] = df.apply(lambda row: fetch_weather_risk(row["Latitude"], row["Longitude"]), axis=1)

    # Fetch War Risk
    df["WarRisk"] = df.apply(lambda row: fetch_war_risk(row["Country"]), axis=1)

    # Calculate 'Failure' target variable for training
    # --- MODIFIED: Adjusting conditions to ensure a mix of 0s and 1s for 'Failure' ---
    df["Failure"] = (
        (df["WeatherRisk"] > 0.7) | # Increased threshold
        (df["WarRisk"] > 0.7) |     # Increased threshold
        (df["PastReliability"] < 0.7) | # Made stricter
        (pd.Series([random.random() for _ in range(len(df))]) < 0.05) # Reduced random chance
    ).astype(int)
    # --- END MODIFIED ---

    # Save processed data
    df.to_csv(PROCESSED_CSV, index=False)
    print(f"✅ Processed data saved to {PROCESSED_CSV}")

    # Train model
    trained_model = train_model(df, MODEL_PATH)
    print(f"✅ Model trained and saved to {MODEL_PATH}")


def get_best_suppliers(dc_city: str = None):
    """
    Returns best suppliers and all suppliers data, optionally filtered by a distribution center city.
    """
    if not PROCESSED_CSV.exists():
        print(f"DEBUG: Processed CSV not found at {PROCESSED_CSV}. Running pipeline...")
        run_pipeline()
    if not MODEL_PATH.exists():
        print(f"DEBUG: Model not found at {MODEL_PATH}. Running pipeline to train...")
        run_pipeline()
    
    df = pd.read_csv(PROCESSED_CSV)

    # Load the trained model
    model = joblib.load(MODEL_PATH)

    # Load warehouses data and filter for India
    warehouses_df = pd.read_csv(WAREHOUSES_CSV)
    india_warehouses_df = warehouses_df[warehouses_df['Country'] == 'India'].copy()

    unique_cities = india_warehouses_df["City"].unique().tolist()
    warehouses_list = india_warehouses_df.to_dict(orient='records')

    dc_lat, dc_lon = None, None
    actual_dc_city = None

    if dc_city and dc_city in unique_cities:
        actual_dc_city = dc_city
        dc_info = india_warehouses_df[india_warehouses_df["City"] == dc_city].iloc[0]
        dc_lat, dc_lon = dc_info["Latitude"], dc_info["Longitude"]
    elif unique_cities:
        # Filter out supplier cities from unique_cities for DC selection
        supplier_cities = df['City'].unique().tolist()
        non_overlapping_cities = [city for city in unique_cities if city not in supplier_cities]

        if non_overlapping_cities:
            actual_dc_city = non_overlapping_cities[0]
            dc_info = india_warehouses_df[india_warehouses_df["City"] == actual_dc_city].iloc[0]
            dc_lat, dc_lon = dc_info["Latitude"], dc_info["Longitude"]
            print(f"DEBUG: No specific DC city provided or selected DC city overlaps with supplier. Automatically selected '{actual_dc_city}' as the distribution center to avoid overlapping with supplier city.")
        else:
            print("DEBUG: All warehouse cities overlap with supplier cities. Cannot select a non-overlapping DC.")
            return {
                "best_suppliers": [],
                "all_suppliers": df.to_dict(orient='records'),
                "unique_cities": unique_cities,
                "warehouses": warehouses_list
            }
    
    if dc_lat is not None and dc_lon is not None:
        print(f"DEBUG: Distribution Center set to {actual_dc_city} ({dc_lat}, {dc_lon}).")
    else:
        print("DEBUG: No warehouse data available or no suitable DC city found. Cannot determine distribution center.")
        return {
            "best_suppliers": [],
            "all_suppliers": df.to_dict(orient='records'),
            "unique_cities": unique_cities,
            "warehouses": warehouses_list
        }
    
    # Calculate FailureProb and DistanceKM for ALL suppliers relative to the selected DC
    df["FailureProb"] = model.predict_proba(df[FEATURES])[:, 1]
    df["DistanceKM"] = df.apply(lambda row: haversine(dc_lat, dc_lon, row["Latitude"], row["Longitude"]), axis=1)

    min_fail_prob = df["FailureProb"].min()
    max_fail_prob = df["FailureProb"].max()
    min_dist_km = df["DistanceKM"].min()
    max_dist_km = df["DistanceKM"].max()

    # Handle cases where min/max are the same to avoid division by zero
    df["RiskNorm"] = (df["FailureProb"] - min_fail_prob) / (max_fail_prob - min_fail_prob + 1e-9) if (max_fail_prob - min_fail_prob) != 0 else 0
    df["DistNorm"] = (df["DistanceKM"] - min_dist_km) / (max_dist_km - min_dist_km + 1e-9) if (max_dist_km - min_dist_km) != 0 else 0
    
    df["CombinedScore"] = 0.7 * df["RiskNorm"] + 0.3 * df["DistNorm"]

    # Rank suppliers by Product
    def get_best_for_product(group):
        # Sort by CombinedScore (lower is better), then by PastReliability (higher is better)
        return group.sort_values(by=["CombinedScore", "PastReliability"], ascending=[True, False]).head(1)

    best_suppliers_by_product = df.groupby("Product").apply(get_best_for_product).reset_index(drop=True)

    print(f"DEBUG: Found {len(best_suppliers_by_product)} best suppliers by product.")

    return {
        "best_suppliers": best_suppliers_by_product.to_dict(orient='records'),
        "all_suppliers": df.to_dict(orient='records'),
        "unique_cities": unique_cities,
        "warehouses": warehouses_list
    }
