# ml.py
import numpy as np
from sklearn.ensemble import IsolationForest

# -------- MODEL INIT (LOAD ONCE) -------- #

FEATURES = [
    "speed_kmph",
    "rpm",
    "engine_temp_c",
    "coolant_temp_c",
    "brake_wear_percent",
    "battery_voltage_v",
    "fuel_level_percent",
    "throttle_position_percent",
    "acceleration_mps2"
]

iso_forest = IsolationForest(
    n_estimators=100,
    contamination=0.05,
    random_state=42
)

# Dummy warm-up fit (replace later with real historical data)
def warmup():
    dummy_data = np.random.normal(size=(200, len(FEATURES)))
    iso_forest.fit(dummy_data)

warmup()

# -------- INFERENCE -------- #

def extract_features(telemetry: dict) -> np.ndarray:
    return np.array([[telemetry[f] for f in FEATURES]])

def detect_anomaly(telemetry: dict) -> dict:
    X = extract_features(telemetry)
    score = iso_forest.decision_function(X)[0]
    pred = iso_forest.predict(X)[0]  # -1 = anomaly

    if pred == -1:
        return {
            "is_anomaly": True,
            "anomaly_score": float(score)
        }

    return {
        "is_anomaly": False,
        "anomaly_score": float(score)
    }

def severity_from_score(score: float) -> str:
    if score < -0.2:
        return "HIGH"
    if score < -0.1:
        return "MEDIUM"
    return "LOW"

def generate_diagnosis(telemetry: dict) -> dict:
    if telemetry["engine_temp_c"] > 95:
        return {
            "probable_cause": "Abnormal engine temperature pattern detected",
            "recommendation": "Inspect cooling system immediately",
            "confidence": 0.88
        }

    if telemetry["brake_wear_percent"] > 70:
        return {
            "probable_cause": "Brake wear anomaly detected",
            "recommendation": "Schedule brake pad replacement",
            "confidence": 0.84
        }

    return {}
