from analytics import (
    anomaly_score_stats,
    alert_rate,
    mean_time_to_detect
)

print("Anomaly stats:", anomaly_score_stats())
print("Alert rate:", alert_rate())
print("MTTD:", mean_time_to_detect())
