"""
Telemetry Simulator - Generates realistic car telemetry data for demo/testing
"""

import threading
import time
from datetime import datetime
from typing import Dict, Optional, Callable
import random

class TelemetrySimulator:
    def __init__(self):
        self.state = {
            'isRunning': False,
            'speed': 0,
            'rpm': 800,
            'engineTemp': 80,
            'coolantTemp': 75,
            'fuel': 85,
            'battery': 13.5,
            'brake': 15,
            'latitude': 40.7128,
            'longitude': -74.006,
            'direction': 45,
        }
        self.simulator_thread: Optional[threading.Thread] = None
        self.should_stop = False
        self.callbacks = []
        self.history = []
        self.active_vehicles = {}  # Track active simulator instances per vehicle
        
    def subscribe(self, callback: Callable):
        """Subscribe to telemetry updates"""
        self.callbacks.append(callback)
        
    def unsubscribe(self, callback: Callable):
        """Unsubscribe from telemetry updates"""
        if callback in self.callbacks:
            self.callbacks.remove(callback)
    
    def start(self, vehicle_id: str = 'DEMO-VEHICLE-001'):
        """Start the simulator for a vehicle"""
        if vehicle_id in self.active_vehicles:
            return {"status": "already_running", "vehicle_id": vehicle_id}
        
        # Create a new simulator instance for this vehicle
        vehicle_simulator = VehicleSimulator(vehicle_id, self.callbacks)
        vehicle_simulator.start()
        self.active_vehicles[vehicle_id] = vehicle_simulator
        
        return {"status": "started", "vehicle_id": vehicle_id}
    
    def stop(self, vehicle_id: str = 'DEMO-VEHICLE-001'):
        """Stop the simulator for a vehicle"""
        if vehicle_id in self.active_vehicles:
            self.active_vehicles[vehicle_id].stop()
            del self.active_vehicles[vehicle_id]
            return {"status": "stopped", "vehicle_id": vehicle_id}
        
        return {"status": "not_running", "vehicle_id": vehicle_id}
    
    def stop_all(self):
        """Stop all active simulators"""
        for vehicle_id in list(self.active_vehicles.keys()):
            self.stop(vehicle_id)
    
    def is_running(self, vehicle_id: str = 'DEMO-VEHICLE-001') -> bool:
        """Check if simulator is running for a vehicle"""
        return vehicle_id in self.active_vehicles
    
    def get_status(self, vehicle_id: str = 'DEMO-VEHICLE-001'):
        """Get simulator status"""
        return {
            "vehicle_id": vehicle_id,
            "isRunning": self.is_running(vehicle_id),
            "activeVehicles": list(self.active_vehicles.keys())
        }


class VehicleSimulator:
    """Individual vehicle simulator"""
    def __init__(self, vehicle_id: str, callbacks: list):
        self.vehicle_id = vehicle_id
        self.callbacks = callbacks
        self.state = {
            'speed': 0,
            'rpm': 800,
            'engineTemp': 80,
            'coolantTemp': 75,
            'fuel': 85,
            'battery': 13.5,
            'brake': 15,
            'latitude': 40.7128,
            'longitude': -74.006,
        }
        self.should_stop = False
        self.thread: Optional[threading.Thread] = None
        
    def start(self):
        """Start the simulation thread"""
        self.should_stop = False
        self.thread = threading.Thread(target=self._run, daemon=True)
        self.thread.start()
    
    def stop(self):
        """Stop the simulation thread"""
        self.should_stop = True
        if self.thread:
            self.thread.join(timeout=2)
    
    def _run(self):
        """Main simulation loop"""
        while not self.should_stop:
            try:
                self._simulate_movement()
                telemetry = self._get_current_telemetry()
                
                # Try to save to Redis, but don't fail if it's not available
                try:
                    from redis_client import set_telemetry
                    set_telemetry(self.vehicle_id, telemetry)
                except Exception as redis_err:
                    print(f"Redis warning for {self.vehicle_id}: {redis_err}")
                
                # Notify callbacks
                for callback in self.callbacks:
                    try:
                        callback(telemetry)
                    except Exception as e:
                        print(f"Callback error: {e}")
                
                time.sleep(1)  # Update every second
            except Exception as e:
                print(f"Simulator error for {self.vehicle_id}: {e}")
                break
    
    def _simulate_movement(self):
        """Simulate realistic car movement"""
        # Speed changes (0-120 km/h)
        speed_change = (random.random() - 0.5) * 15
        self.state['speed'] = max(0, min(120, self.state['speed'] + speed_change))
        
        # RPM follows speed (idle ~800 RPM, max ~6500 RPM)
        target_rpm = 800 + (self.state['speed'] / 120) * 5700
        self.state['rpm'] = self.state['rpm'] + (target_rpm - self.state['rpm']) * 0.2
        
        # Engine temperature (varies with RPM and ambient ~20°C)
        temp_change = (self.state['rpm'] / 6000 - 0.3) * 0.5
        self.state['engineTemp'] = max(70, min(110, self.state['engineTemp'] + temp_change))
        
        # Coolant temperature follows engine temp
        self.state['coolantTemp'] = max(
            60, 
            min(100, self.state['engineTemp'] - 5 + (random.random() - 0.5) * 2)
        )
        
        # Fuel consumption (rough estimate: 8L/100km)
        fuel_usage = (self.state['speed'] / 100) * 0.08 / 3600
        self.state['fuel'] = max(5, self.state['fuel'] - fuel_usage)
        
        # Battery voltage (normal: 13.5V, under load: 13.2-14.5V)
        load_factor = self.state['rpm'] / 6000
        self.state['battery'] = 13.5 + (load_factor - 0.5) * 1.0 + (random.random() - 0.5) * 0.1
        self.state['battery'] = max(12.5, min(14.8, self.state['battery']))
        
        # Brake wear (minor changes)
        if self.state['speed'] < 5:
            self.state['brake'] += random.random() * 0.001
        elif random.random() > 0.9:
            self.state['brake'] += random.random() * 0.005
        
        # Location changes (simple movement for demo)
        self.state['latitude'] += (random.random() - 0.5) * 0.0001
        self.state['longitude'] += (random.random() - 0.5) * 0.0001
    
    def _get_current_telemetry(self) -> dict:
        """Get current telemetry data"""
        return {
            'vehicle_id': self.vehicle_id,
            'timestamp': datetime.utcnow().isoformat(),
            'speed_kmph': round(self.state['speed'] * 10) / 10,
            'rpm': round(self.state['rpm']),
            'engine_temp_c': round(self.state['engineTemp'] * 10) / 10,
            'coolant_temp_c': round(self.state['coolantTemp'] * 10) / 10,
            'brake_wear_percent': min(100, round(self.state['brake'] * 10) / 10),
            'battery_voltage_v': round(self.state['battery'] * 100) / 100,
            'fuel_level_percent': round(self.state['fuel'] * 10) / 10,
            'latitude': round(self.state['latitude'] * 10000) / 10000,
            'longitude': round(self.state['longitude'] * 10000) / 10000,
            'engine_status': 'ON' if self.state['rpm'] > 500 else 'OFF',
        }


# Global simulator instance
telemetry_simulator = TelemetrySimulator()
