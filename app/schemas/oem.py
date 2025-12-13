from pydantic import BaseModel
from typing import List, Dict

class ComponentFailureStats(BaseModel):
    component: str
    count: int

class ModelFaultTrends(BaseModel):
    model: str
    fault_count: int

class SeverityStats(BaseModel):
    severity: str
    count: int
