# Hospital Appointment and Record Management System

A modern, full-featured hospital management system built with Vue.js 3, featuring appointment scheduling, medical record management, and patient administration.

## Features

- **User Authentication**: Login and registration with role-based access (Patient, Doctor, Admin)
- **Appointment Management**: Schedule, view, cancel, and complete appointments
- **Medical Records**: Create, view, and manage patient medical records
- **Patient Management**: Comprehensive patient database with detailed information
- **Role-Based Dashboard**: Customized dashboards for different user roles
- **Modern UI**: Beautiful, responsive design with smooth animations

## Tech Stack

- **Vue.js 3** - Progressive JavaScript framework
- **Vue Router** - Official router for Vue.js
- **Pinia** - State management for Vue
- **Vite** - Next-generation frontend tooling
- **Axios** - HTTP client for API requests

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/       # Reusable components (Navbar, etc.)
├── views/           # Page components (Login, Dashboard, etc.)
├── router/          # Vue Router configuration
├── stores/          # Pinia state management
├── services/        # API service layer
├── App.vue          # Root component
├── main.js          # Application entry point
└── style.css        # Global styles
```

## User Roles

### Patient
- View and schedule appointments
- View own medical records
- Access personal dashboard

### Doctor
- View assigned appointments
- Create and manage medical records
- View patient information
- Complete appointments

### Administrator
- Full access to all features
- Manage all appointments
- Manage all medical records
- Manage patient database

## Demo Credentials

For testing purposes, the system uses mock authentication. You can:
- Register a new account with any email
- Use emails containing "doctor" or "admin" to get those roles
- Example: `doctor@hospital.com` or `admin@hospital.com`

## Features in Detail

### Appointment Management
- Schedule appointments with date, time, and reason
- View all appointments in a card-based layout
- Cancel or complete appointments
- Filter appointments by status

### Medical Records
- Create detailed medical records with diagnosis and treatment
- View patient medical history
- Edit and update existing records
- Track medications and notes

### Patient Management
- Add new patients with comprehensive information
- View patient statistics (appointments, records)
- Edit patient details
- Search and filter patients

## Development Notes

- The application uses mock data stored in memory (localStorage for auth)
- In production, replace the mock API calls in `src/services/api.js` with actual backend endpoints
- All API calls are structured to be easily replaced with real HTTP requests

## License

This project is created for educational purposes as part of the Fundamentals of System Analysis and Design course.

