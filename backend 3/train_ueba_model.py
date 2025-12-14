import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import IsolationForest

def generate_mock_data(n_normal=500, n_anomalies=50):
    # Normal behavior
    normal_data = pd.DataFrame({
        "total_requests": np.random.randint(10, 50, n_normal),
        "unique_endpoints": np.random.randint(2, 6, n_normal),
        "unique_ips": np.random.randint(1, 3, n_normal),
        "avg_requests_per_min": np.random.uniform(2, 8, n_normal)
    })
    #abnormal behavior
    anomaly_data = pd.DataFrame({
        "total_requests": np.random.randint(120, 250, n_anomalies),
        "unique_endpoints": np.random.randint(10, 30, n_anomalies),
        "unique_ips": np.random.randint(3, 8, n_anomalies),
        "avg_requests_per_min": np.random.uniform(20, 50, n_anomalies)
    })
    return pd.concat([normal_data, anomaly_data], ignore_index=True)

def train_model():
    df = generate_mock_data()

    model = IsolationForest(
        n_estimators=150,
        contamination=0.08,
        random_state=42
    )

    model.fit(df)

    joblib.dump(model, "ueba_model.pkl")

if __name__ == "__main__":
    train_model()
