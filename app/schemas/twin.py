from pydantic import BaseModel
from typing import Optional, List

class TwinSnapshot(BaseModel):
    vin: str
    speed: float
    rpm: float
    engine_temp: float
    battery_level: float
    brake_wear: float
    driver_score: float
    severity: str
    predicted_issues: List[str] = []
