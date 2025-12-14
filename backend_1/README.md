# Vehicle Health Monitoring - Master Agent Backend

This is the Master Agent backend service built with FastAPI and MongoDB.

## 🏃 How to Run

### Prerequisites
- Python 3.12+
- MongoDB Atlas (or local MongoDB)

### Setup
1. **Create Virtual Environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   pip install bcrypt==4.0.1  # Required for passlib compatibility
   ```
3. **Environment Variables**:
   Ensure your `.env` file has the correct `MONGO_URI`.

### Start Server
The server runs on port **8001** by default (to avoid conflicts).
```bash
./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### Run Verification Tests
```bash
./venv/bin/python verify_api.py
```

---

## 📚 API Endpoints

### 🔐 Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/auth/register` | Register a new user (Customer, Service Center, OEM) | No |
| `POST` | `/auth/login` | Login and get JWT access token | No |

### 🚗 Customer (Role: CUSTOMER)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/customer/vehicles` | List all vehicles owned by the current user |
| `POST` | `/customer/vehicles` | Register a new vehicle for the current user |
| `GET` | `/customer/alerts` | Get vehicle alerts (Placeholder) |
| `GET` | `/customer/bookings` | Get service bookings (Placeholder) |
| `POST` | `/customer/bookservice` | Book a service (Placeholder) |
| `POST` | `/customer/respond` | Respond to an alert (Placeholder) |

### 🛠️ Vehicle Management (Role: SERVICE_CENTER, OEM_ADMIN)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/vehicles/` | Register a vehicle for any user (requires owner email) |
| `GET` | `/vehicles/{vehicle_id}` | Get vehicle details by ID |
| `PUT` | `/vehicles/{vehicle_id}` | Update vehicle details |

### 🌐 Digital Twin (Read-Only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/twin/{vehicle_id}` | Get digital twin state (speed, rpm, health, etc.) |

### 📊 OEM Analytics (Role: OEM_ADMIN)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/oem/analytics` | Get component failure analytics |
| `GET` | `/oem/ueba` | Get User and Entity Behavior Analytics (UEBA) events |

---

## 📄 Swagger Documentation
Once the server is running, visit:
**[http://localhost:8001/docs](http://localhost:8001/docs)**
