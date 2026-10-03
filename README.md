# deePhysio

Modern, Multi-Tenant SaaS Physiotherapy & Clinic Management Platform.

## 🚀 Overview

deePhysio is an all-in-one clinic administration, electronic health records (EHR), and patient care management system designed specifically for physiotherapy practices.

### Key Features
- **Multi-Tenant Architecture**: Manage single or multi-branch clinics with role-based access control.
- **Clinical EHR & SOAP Notes**: Standardized clinical documentation, assessments, and treatment plans.
- **Appointment Scheduling**: Real-time booking, calendar management, and waitlists.
- **Billing & Invoicing**: Automated invoices, payment tracking, claims, and financial analytics.
- **Omnichannel Communication**: Automated WhatsApp & SMS appointment notifications and reminders.
- **Cross-Platform**: Web application for clinic desktop workflows and mobile app for on-the-go access.

---

## 📁 Repository Structure

```text
deephysio/
├── deePhysio-Backend (2)/      # Node.js & Express REST API Backend
├── deePhysio-Frontend (2)/     # React + Vite Web Application
└── deephysio-mobile/           # React Native + Expo Mobile Application
```

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm / yarn
- MongoDB / PostgreSQL database instance (as configured in backend)
- Expo Go app (for mobile testing)

---

### 1. Backend Setup
```bash
cd "deePhysio-Backend (2)"
npm install
# Configure your .env file based on .env.example
npm run dev
```

### 2. Frontend Setup
```bash
cd "deePhysio-Frontend (2)"
npm install
npm run dev
```

### 3. Mobile App Setup
```bash
cd deephysio-mobile
npm install
npx expo start
```

---

## 📄 License
Proprietary / All Rights Reserved.
