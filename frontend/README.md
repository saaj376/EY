# Vehicle Intelligence Platform - Frontend

A modern, beautiful React frontend for the Vehicle Intelligence Platform built with TypeScript, Vite, and Tailwind CSS.

## Features

- 🎨 **Modern UI** - Beautiful, responsive design with Tailwind CSS
- 📊 **Real-time Monitoring** - Live telemetry data visualization
- 🚨 **Alert Management** - Comprehensive alert tracking and management
- 🔧 **Service Workflow** - Complete service booking and job management
- 📈 **Analytics Dashboard** - Rich analytics and metrics visualization
- 🔍 **Root Cause Analysis** - RCA creation and tracking
- ✅ **CAPA Management** - Corrective and Preventive Actions tracking
- 👥 **Role-based Access** - Support for Customer, Service Center, OEM Admin, and OEM Analyst roles

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **Lucide React** - Icons
- **date-fns** - Date formatting

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Configuration

The frontend is configured to proxy API requests to the backend. Update the proxy settings in `vite.config.ts` if your backend runs on a different port.

You can also set the API URL via environment variable:
```bash
VITE_API_URL=http://localhost:8000 npm run dev
```

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable components
│   │   └── Layout.tsx   # Main layout with sidebar
│   ├── pages/           # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Vehicles.tsx
│   │   ├── Alerts.tsx
│   │   ├── Telemetry.tsx
│   │   ├── ServiceBooking.tsx
│   │   ├── RCA.tsx
│   │   ├── CAPA.tsx
│   │   └── Analytics.tsx
│   ├── services/        # API services
│   │   └── api.ts       # API client and endpoints
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Features by Role

### Customer
- View vehicles
- Monitor telemetry
- View alerts and diagnoses
- Book service appointments
- View invoices

### Service Center
- View bookings
- Manage job cards
- View assigned CAPA items
- Monitor related alerts

### OEM Admin
- Full platform access
- Create RCA
- Manage CAPA
- View analytics

### OEM Analyst
- View analytics
- Monitor telemetry
- Create RCA

## API Integration

The frontend communicates with the FastAPI backend. Make sure the backend is running and accessible. The API client automatically includes the `X-Role` header based on the selected user role.

## Development

### Adding New Pages

1. Create a new component in `src/pages/`
2. Add the route in `src/App.tsx`
3. Add navigation item in `src/components/Layout.tsx` (if needed)

### Styling

The project uses Tailwind CSS with custom utilities defined in `src/index.css`. Use the utility classes for consistent styling:

- `.card` - Card container
- `.btn-primary` - Primary button
- `.btn-secondary` - Secondary button
- `.input` - Form input
- `.badge` - Badge component

## License

MIT


