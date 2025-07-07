import joblib
from xgboost import XGBClassifier

# Corrected FEATURES list to use the renamed column names
FEATURES = ["LeadTime", "Reliability", "Capacity", "WeatherRisk", "WarRisk"]

def train_model(df, model_path):
    """
    Trains an XGBoost classifier model and saves it.

    Args:
        df (pd.DataFrame): The DataFrame containing features and the target variable.
        model_path (Path): The path where the trained model will be saved.

    Returns:
        XGBClassifier: The trained XGBoost model.
    """
    X = df[FEATURES]
    y = df["Failure"]

    model = XGBClassifier(eval_metric="logloss", base_score=0.5)
    
    model.fit(X, y)
    joblib.dump(model, model_path)
    return model

def load_model(model_path):
    """
    Loads a pre-trained XGBoost model from a specified path.

    Args:
        model_path (Path): The path to the saved model file.

    Returns:
        XGBClassifier: The loaded XGBoost model.
    """
    return joblib.load(model_path)
