# Autosphere

**An end-to-end AI-powered platform that transforms vehicle telemetry into actionable insights, automated alerts, and streamlined service workflows—from anomaly detection to service closure.**

---

## Project Overview

A comprehensive vehicle intelligence system that uses ML-powered anomaly detection, voice AI assistance, and automated workflows to predict vehicle failures, enable proactive maintenance, and streamline the entire service lifecycle from alert to resolution.

---

## Problem Statement

Modern vehicles generate massive amounts of telemetry data, but most systems fail to:

- **Detect anomalies early** before they become critical failures
- **Provide actionable insights** to vehicle owners and service centers
- **Streamline service workflows** from diagnosis to repair completion
- **Enable proactive maintenance** rather than reactive repairs
- **Bridge the gap** between vehicle data and human decision-making

Traditional approaches rely on manual monitoring, delayed alerts, and disconnected service processes, leading to:

- Increased vehicle downtime
- Higher repair costs
- Poor customer experience
- Inefficient service center operations
- Missed opportunities for preventive maintenance

---

## Why This Solution Matters

This platform addresses critical pain points across the automotive ecosystem:

### For Vehicle Owners

- **Proactive alerts** before breakdowns occur
- **Voice AI assistant** for instant vehicle health queries via phone
- **Transparent service workflows** with real-time booking and tracking
- **Cost savings** through early intervention

### For Service Centers

- **Automated job scheduling** with capacity management
- **CAPA tracking** for quality improvement
- **Real-time alerts** for high-priority issues
- **Streamlined workflows** from booking to invoice

### For OEMs

- **Fleet-wide analytics** and trend analysis
- **Root Cause Analysis (RCA)** for systemic issues
- **Quality metrics** (false positive rates, detection times)
- **Data-driven insights** for product improvement

---

## Core Features

###  **Phase 1: Telemetry & ML Detection**

- **Real-time telemetry ingestion** from vehicle sensors
- **ML-powered anomaly detection** using Isolation Forest
- **Automated alert generation** with severity classification
- **Digital twin state management** for vehicle health tracking
- **WebSocket-based live telemetry streaming**

###  **Phase 2: Alerts & Diagnosis**

- **Multi-severity alert system** (HIGH, MEDIUM, LOW)
- **AI-generated diagnoses** with confidence scores
- **Rule-based alerting** for critical thresholds (engine temp, brake wear, fuel)
- **Alert history and analytics**

###  **Phase 3: Service Workflow & Closure**

- **Service booking system** with slot availability management
- **Job card creation and tracking**
- **Invoice generation** with parts and labor costs
- **Root Cause Analysis (RCA)** with multiple analysis methods
- **CAPA (Corrective and Preventive Actions)** management
- **End-to-end workflow** from alert → RCA → CAPA → Service → Closure

###  **Voice AI Assistant**

- **Twilio + Deepgram integration** for voice calls
- **Natural language queries** about vehicle health
- **Function calling** to fetch alerts and diagnoses
- **Proactive outbound calls** for high-severity alerts

###  **Analytics & Insights**

- **Anomaly score statistics** and distribution
- **Alert rate trends** over time
- **Mean time to detect** metrics
- **False positive rate** tracking
- **RCA closure rates**
- **Overdue CAPA tracking**

### **Security & Access Control**

- **Role-based access control** (Customer, Service Center, OEM Admin, OEM Analyst)
- **JWT-based authentication** with Google OAuth support
- **UEBA (User Entity Behavior Analytics)** middleware for security monitoring
- **API usage logging** for audit trails

---

##  Tech Stack

### **Frontend**

- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **Google OAuth** - Authentication

### **Backend**

- **FastAPI** - High-performance Python web framework
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation
- **WebSockets** - Real-time communication

### **AI & ML**

- **scikit-learn** - Isolation Forest for anomaly detection
- **NumPy** - Numerical computing
- **LangGraph** - Agent orchestration and workflow graphs
- **OpenAI GPT-4o-mini** - LLM for voice agent reasoning
- **Deepgram Nova-3** - Speech-to-text for voice calls

### **Data & Storage**

- **MongoDB** - Primary database (telemetry, alerts, users, vehicles, bookings, RCA, CAPA)
- **Redis** - Caching and real-time telemetry storage
- **PyMongo** - MongoDB driver

### **Communication & Integration**

- **Twilio** - Voice call infrastructure and WebSocket streaming
- **Deepgram Agent API** - Voice AI platform
- **WebSockets** - Real-time bidirectional communication

### **DevOps & Tools**

- **python-dotenv** - Environment variable management
- **bcrypt** - Password hashing
- **PyJWT** - JWT token handling
- **date-fns** - Date manipulation (frontend)

---

##  System Architecture

### **High-Level Flow**

```
Vehicle Sensors → Telemetry Ingestion → ML Anomaly Detection
                                              ↓
                                    Alert Generation (if anomaly)
                                              ↓
                                    Diagnosis Generation
                                              ↓
                                    Digital Twin Update
                                              ↓
                                    [User Views Alert]
                                              ↓
                                    RCA Creation (OEM Admin)
                                              ↓
                                    CAPA Creation
                                              ↓
                                    Service Booking (Customer)
                                              ↓
                                    Job Card Creation (Service Center)
                                              ↓
                                    Invoice Generation
                                              ↓
                                    Service Closure
```

### **Component Architecture**

1. **Telemetry Pipeline**

   - Simulator generates realistic vehicle data
   - Data ingested via REST API or WebSocket
   - Stored in Redis (live) and MongoDB (history)
   - Processed through LangGraph workflow

2. **ML Processing Graph** (LangGraph)

   - **Anomaly Node**: Isolation Forest detection
   - **Severity Node**: Score-based classification
   - **Alert Node**: Alert creation if anomaly detected
   - **Twin Node**: Digital twin state update

3. **Voice AI Agent**

   - Twilio WebSocket receives audio streams
   - Deepgram Agent processes speech and calls functions
   - Functions query alerts/diagnoses from database
   - Responses streamed back as audio

4. **Service Workflow**

   - Booking system with capacity management
   - Job cards track repair progress
   - Invoices generated with parts/labor
   - Status updates trigger notifications

5. **Analytics Engine**
   - Aggregates data from multiple collections
   - Computes KPIs (detection time, false positive rate, etc.)
   - Provides trend analysis and distributions

### **Data Flow**

- **Telemetry**: Vehicle → Redis (live) → MongoDB (persisted)
- **Alerts**: ML Detection → MongoDB → Frontend/Notifications
- **Service**: Booking → Job Card → Invoice → Closure
- **RCA/CAPA**: Alert → RCA → CAPA → Service Center

---

## How to Run

### **Prerequisites**

- Python 3.9+
- Node.js 18+
- MongoDB (local or cloud)
- Redis (local or cloud)
- Twilio account (for voice features)
- Deepgram API key (for voice AI)
- Google OAuth credentials (for authentication)

### **Backend Setup**

1. **Navigate to backend directory:**

   ```bash
   cd EY/backend
   ```

2. **Create virtual environment (recommended):**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   Create a `.env` file in `EY/backend/`:

   ```env
   MONGO_URI=mongodb://localhost:27017
   DB_NAME=vehicle_intelligence
   REDIS_HOST=localhost
   REDIS_PORT=6379
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   TWILIO_FROM_NUMBER=your_twilio_number
   DEEPGRAM_API_KEY=your_deepgram_key
   OPENAI_API_KEY=your_openai_key
   JWT_SECRET_KEY=your_jwt_secret
   DEFAULT_USER_ID=default_user_id
   ```

5. **Start MongoDB and Redis:**

   ```bash
   # MongoDB (if local)
   mongod

   # Redis (if local)
   redis-server
   ```

6. **Start the backend server:**

   ```bash
   python main.py
   # Or with uvicorn:
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

   Backend will run on `http://localhost:8000`

   - API docs: `http://localhost:8000/docs`
   - Health check: `http://localhost:8000/`

### **Frontend Setup**

1. **Navigate to frontend directory:**

   ```bash
   cd EY/frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in `EY/frontend/`:

   ```env
   VITE_API_URL=http://localhost:8000
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```

4. **Start the development server:**

   ```bash
   npm run dev
   ```

   Frontend will run on `http://localhost:5173` (or port shown in terminal)

### **Quick Start (All Services)**

```bash
# Terminal 1: MongoDB
mongod

# Terminal 2: Redis
redis-server

# Terminal 3: Backend
cd EY/backend
python main.py

# Terminal 4: Frontend
cd EY/frontend
npm run dev
```

---

##  Project Structure

```
EY/
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── telemetry.py            # Telemetry ingestion endpoints
│   ├── telemetry_simulator.py  # Simulated vehicle data generator
│   ├── ml.py                   # ML anomaly detection
│   ├── graph.py                # LangGraph workflow
│   ├── alerts.py               # Alert creation and management
│   ├── rca.py                  # Root Cause Analysis
│   ├── capa.py                 # CAPA management
│   ├── service.py              # Service booking and workflow
│   ├── jobs.py                 # Job card management
│   ├── invoices.py             # Invoice generation
│   ├── analytics.py            # Analytics and metrics
│   ├── voice_agent.py          # Twilio/Deepgram voice AI
│   ├── auth_routes.py          # Authentication endpoints
│   ├── middleware.py           # UEBA middleware
│   ├── db.py                   # MongoDB connection
│   ├── redis_client.py         # Redis client
│   └── requirements.txt         # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── pages/              # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Telemetry.tsx
│   │   │   ├── Alerts.tsx
│   │   │   ├── ServiceBooking.tsx
│   │   │   ├── RCA.tsx
│   │   │   ├── CAPA.tsx
│   │   │   └── Analytics.tsx
│   │   ├── components/        # Reusable components
│   │   ├── services/           # API clients
│   │   ├── contexts/           # React contexts (Auth)
│   │   └── types/              # TypeScript types
│   ├── package.json
│   └── vite.config.ts
│
└── README.md                   # This file
```

---


##  License

MIT License - feel free to use this project for learning and development.

---

