import pandas as pd
import joblib
from pathlib import Path
from xgboost import XGBClassifier
from utils import fetch_weather_risk, fetch_war_risk, haversine

FEATURES = ["LeadTime", "Reliability", "Capacity", "WeatherRisk", "WarRisk"]
RAW_CSV = Path("backend/data/updated_supplier_dataset.csv")
PROCESSED_CSV = Path("backend/processed/supplier_dataset_with_risk.csv")
MODEL_PATH = Path("backend/models/supplier_failure_xgb.pkl")

# Ensure directories exist
Path("backend/processed").mkdir(parents=True, exist_ok=True)
Path("backend/data").mkdir(parents=True, exist_ok=True)

def run_pipeline():
    """
    Runs the data processing pipeline:
    1. Reads raw supplier data.
    2. Renames columns for consistency.
    3. Fetches external risk factors (weather, war).
    4. Calculates a 'Failure' target based on combined risks.
    5. Trains an XGBoost classifier model.
    6. Saves the processed data and the trained model.
    """
    if not RAW_CSV.exists():
        raise FileNotFoundError(f"❌ Raw dataset not found at {RAW_CSV}. Please ensure 'updated_supplier_dataset.csv' is in 'backend/data/'.")

    df = pd.read_csv(RAW_CSV)

    df = df.rename(columns={
        "LeadTimeDays": "LeadTime",
        "PastReliability": "Reliability",
        "ProductName": "Product"
    })

    # Apply risk fetching functions
    df["WeatherRisk"] = df.apply(lambda row: fetch_weather_risk(row["Latitude"], row["Longitude"]), axis=1)
    df["WarRisk"] = df.apply(lambda row: fetch_war_risk(row["Country"]), axis=1)

    # Calculate 'Failure' based on a threshold of combined risk factors
    df["Failure"] = ((1 - df["Reliability"]) * 0.6 + (df["WeatherRisk"] + df["WarRisk"]) * 0.2 + (1 - df["Capacity"] / df["Capacity"].max()) * 0.2 > 0.5).astype(int)

    X = df[FEATURES]
    y = df["Failure"]
    
    from model import train_model
    model = train_model(df, MODEL_PATH)

    # Save processed data
    df.to_csv(PROCESSED_CSV, index=False)
    print(f"✅ Pipeline complete. Processed data saved to {PROCESSED_CSV}")
    print(f"✅ Model saved to {MODEL_PATH}")


def get_best_suppliers():
    """
    Retrieves and calculates the best suppliers based on processed data.
    If the processed data or model doesn't exist, it triggers the pipeline.
    1. Loads processed data and trained model.
    2. Calculates failure probabilities and distances.
    3. Normalizes risk and distance scores.
    4. Computes a combined score.
    5. Returns the best supplier for each product AND the full dataset.
    """
    # Check if processed CSV and model exist; if not, run the pipeline
    if not PROCESSED_CSV.exists() or not MODEL_PATH.exists():
        print("ℹ️ Processed data or model not found. Running pipeline to generate them...")
        run_pipeline() # This will create the necessary files

    df = pd.read_csv(PROCESSED_CSV)
    
    from model import load_model
    model = load_model(MODEL_PATH)

    if df["City"].empty:
        print("⚠️ No city data available to determine distribution center. Skipping distance calculation.")
        df["FailureProb"] = model.predict_proba(df[FEATURES])[:, 1]
        df["DistanceKM"] = 0
        df["RiskNorm"] = (df["FailureProb"] - df["FailureProb"].min()) / (df["FailureProb"].max() - df["FailureProb"].min() + 1e-9)
        df["DistNorm"] = 0
        df["CombinedScore"] = 0.7 * df["RiskNorm"] + 0.3 * df["DistNorm"]
    else:
        dc_data = df[df["City"] == df["City"].unique()[0]].iloc[0]
        dc_lat, dc_lon = dc_data["Latitude"], dc_data["Longitude"]

        df["FailureProb"] = model.predict_proba(df[FEATURES])[:, 1]
        df["DistanceKM"] = df.apply(lambda row: haversine(dc_lat, dc_lon, row["Latitude"], row["Longitude"]), axis=1)

        min_fail_prob = df["FailureProb"].min()
        max_fail_prob = df["FailureProb"].max()
        min_dist_km = df["DistanceKM"].min()
        max_dist_km = df["DistanceKM"].max()

        df["RiskNorm"] = (df["FailureProb"] - min_fail_prob) / (max_fail_prob - min_fail_prob + 1e-9)
        df["DistNorm"] = (df["DistanceKM"] - min_dist_km) / (max_dist_km - min_dist_km + 1e-9)
        
        df["CombinedScore"] = 0.7 * df["RiskNorm"] + 0.3 * df["DistNorm"]

    best = df.sort_values("CombinedScore").groupby("Product", as_index=False).first()
    
    # Return both best suppliers and the full processed dataframe
    return {
        "best_suppliers": best.to_dict(orient="records"),
        "all_suppliers": df.to_dict(orient="records")
    }
