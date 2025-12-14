# Vehicle Intelligence Platform - Setup Guide

## Quick Start

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend/backend
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   Create a `.env` file in `backend/backend/`:
   ```
   MONGO_URI=mongodb://localhost:27017
   DB_NAME=vehicle_intelligence
   ```

4. **Start the backend server:**
   ```bash
   python main.py
   ```
   
   Or using uvicorn directly:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

   The backend will run on `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:3000`

## Features

### ✅ Fixed Issues

1. **CORS Support** - Added CORS middleware to handle cross-origin requests from frontend
2. **Analytics Endpoint** - Created `/analytics` endpoint for dashboard metrics
3. **Error Handling** - Added graceful error handling for missing database connections
4. **Server Startup** - Fixed main.py to properly start the uvicorn server

### Backend Endpoints

- `GET /` - Health check
- `GET /docs` - API documentation (Swagger UI)
- `GET /analytics` - Analytics data
- `GET /user/*` - User endpoints (vehicles, alerts, bookings, etc.)
- `GET /service/*` - Service center endpoints
- `POST /telemetry` - Ingest telemetry data
- `POST /rca` - Create Root Cause Analysis
- `POST /capa` - Create CAPA
- `POST /service/booking` - Create service booking

### Frontend Pages

- `/dashboard` - Overview with stats and quick actions
- `/vehicles` - Vehicle management
- `/alerts` - Alert monitoring
- `/telemetry` - Real-time telemetry monitoring
- `/service` - Service booking and workflow
- `/rca` - Root Cause Analysis
- `/capa` - Corrective & Preventive Actions
- `/analytics` - Analytics dashboard

## Troubleshooting

### Backend Issues

**MongoDB Connection Error:**
- Make sure MongoDB is running
- Check `MONGO_URI` in `.env` file
- The app will start even without MongoDB but will return empty data

**Port Already in Use:**
- Change the port in `main.py` or use: `uvicorn main:app --port 8001`

### Frontend Issues

**CORS Errors:**
- Make sure backend is running on port 8000
- Check that CORS middleware is enabled in `main.py`

**API Connection Errors:**
- Verify backend is running: `http://localhost:8000`
- Check browser console for detailed error messages
- Ensure `X-Role` header is being sent (check Network tab)

## Development

### Backend
- Uses FastAPI with automatic API documentation
- Access Swagger UI at: `http://localhost:8000/docs`
- Access ReDoc at: `http://localhost:8000/redoc`

### Frontend
- Hot module replacement enabled
- TypeScript for type safety
- Tailwind CSS for styling
- React Router for navigation

## Production Build

### Frontend
```bash
cd frontend
npm run build
```
Output will be in `frontend/dist/`

### Backend
The backend can be run with uvicorn in production mode:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```


