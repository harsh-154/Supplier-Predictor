import pandas as pd
import joblib
from pathlib import Path
from xgboost import XGBClassifier
from utils import fetch_weather_risk, fetch_war_risk, haversine
# Removed duplicate 'from pathlib import Path'

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
    # This logic determines if a supplier is likely to 'fail' (1) or not (0)
    df["Failure"] = ((1 - df["Reliability"]) * 0.6 + (df["WeatherRisk"] + df["WarRisk"]) * 0.2 + (1 - df["Capacity"] / df["Capacity"].max()) * 0.2 > 0.5).astype(int)

    # --- DIAGNOSTIC PRINT STATEMENT ---
    print("\n--- Failure Column Distribution ---")
    print(df["Failure"].value_counts())
    print("-----------------------------------\n")
    # --- END DIAGNOSTIC ---

    X = df[FEATURES]
    y = df["Failure"]
    
    # Import train_model here to avoid circular dependencies if model.py also imports pipeline.py
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
    5. Returns the best supplier for each product.
    """
    # Check if processed CSV and model exist; if not, run the pipeline
    if not PROCESSED_CSV.exists() or not MODEL_PATH.exists():
        print("ℹ️ Processed data or model not found. Running pipeline to generate them...")
        run_pipeline() # This will create the necessary files

    df = pd.read_csv(PROCESSED_CSV)
    
    # Import load_model here
    from model import load_model
    model = load_model(MODEL_PATH)

    # Assuming a distribution center (DC) for distance calculation.
    # Taking the first unique city's coordinates as a proxy for the DC.
    # This might need to be more dynamic in a real-world scenario.
    if df["City"].empty:
        print("⚠️ No city data available to determine distribution center. Skipping distance calculation.")
        # Handle case where df is empty or no cities
        df["FailureProb"] = model.predict_proba(df[FEATURES])[:, 1]
        df["DistanceKM"] = 0 # Default to 0 if no DC can be determined
        df["RiskNorm"] = (df["FailureProb"] - df["FailureProb"].min()) / (df["FailureProb"].max() - df["FailureProb"].min() + 1e-9)
        df["DistNorm"] = 0 # Default to 0
        df["CombinedScore"] = 0.7 * df["RiskNorm"] + 0.3 * df["DistNorm"]
    else:
        dc_data = df[df["City"] == df["City"].unique()[0]].iloc[0]
        dc_lat, dc_lon = dc_data["Latitude"], dc_data["Longitude"]

        df["FailureProb"] = model.predict_proba(df[FEATURES])[:, 1]
        df["DistanceKM"] = df.apply(lambda row: haversine(dc_lat, dc_lon, row["Latitude"], row["Longitude"]), axis=1)

        # Normalize risk and distance for combined score calculation
        min_fail_prob = df["FailureProb"].min()
        max_fail_prob = df["FailureProb"].max()
        min_dist_km = df["DistanceKM"].min()
        max_dist_km = df["DistanceKM"].max()

        # Add a small epsilon to denominator to prevent division by zero if min == max
        df["RiskNorm"] = (df["FailureProb"] - min_fail_prob) / (max_fail_prob - min_fail_prob + 1e-9)
        df["DistNorm"] = (df["DistanceKM"] - min_dist_km) / (max_dist_km - min_dist_km + 1e-9)
        
        # Calculate combined score (lower is better for both risk and distance)
        # Note: If RiskNorm is higher (more risk), we want a lower CombinedScore.
        # If DistNorm is higher (further distance), we want a lower CombinedScore.
        # So, we might want to invert one or both if a higher score is desired for "best".
        # Current formula: 0.7 * RiskNorm + 0.3 * DistNorm
        # If RiskNorm is high (e.g., 0.9) and DistNorm is high (e.g., 0.9), CombinedScore will be high.
        # To get "best" suppliers, you'd want *lower* risk and *lower* distance,
        # so a *lower* combined score would indicate "best".
        df["CombinedScore"] = 0.7 * df["RiskNorm"] + 0.3 * df["DistNorm"]


    # Sort by combined score (ascending for "best" if lower score is better)
    # and group by product to get the best supplier for each product
    best = df.sort_values("CombinedScore").groupby("Product", as_index=False).first()
    return best.to_dict(orient="records")

