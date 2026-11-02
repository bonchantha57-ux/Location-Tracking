# 🛰️ MAP TRACKING - Professional Fullstack Architecture

ប្រព័ន្ធតាមដាន និងចែករំលែកទីតាំងផ្ទាល់ក្នុងពេលជាក់ស្តែង (Real-time Live Location Tracking) បង្កើតឡើងដោយប្រើប្រាស់ **Professional Fullstack Architecture** ដែលបែងចែកជា **Backend (Node.js/Express + Firebase Admin + Socket.IO)** និង **Frontend (React + Tailwind CSS + Leaflet)** យ៉ាងស្អាត និងមានសុវត្ថិភាពខ្ពស់។

---

## 🏗️ រចនាសម្ព័ន្ធ Project (Clean Fullstack Structure)

```
Maptrackking/
  │
  ├── backend/                          # 🚀 BACKEND API & WEBSOCKET ENGINE
  │    ├── src/
  │    │    ├── config/
  │    │    │    └── firebaseAdmin.js   # Firebase Admin SDK & Persistent DB
  │    │    ├── controllers/
  │    │    │    ├── authController.js     # Register, Login (JWT + bcryptjs)
  │    │    │    ├── locationController.js # Geolocation & Tracking Rooms
  │    │    │    └── adminController.js    # Admin stats, God-view & Permissions
  │    │    ├── middleware/
  │    │    │    └── authMiddleware.js     # JWT Verification & Admin Guard
  │    │    ├── routes/
  │    │    │    ├── authRoutes.js         # /api/auth/*
  │    │    │    ├── locationRoutes.js     # /api/location/*
  │    │    │    └── adminRoutes.js        # /api/admin/*
  │    │    ├── sockets/
  │    │    │    └── locationSocket.js     # Real-time WebSocket Live Location Stream
  │    │    └── server.js                  # Express Server Entry Point (Port 5000)
  │    ├── .env                         # កំណត់ Firebase Keys & JWT Secret សម្ងាត់
  │    ├── .env.example
  │    └── package.json
  │
  ├── frontend/                         # 🎨 FRONTEND CLIENT (REACT + LEAFLET)
  │    ├── src/
  │    │    ├── api/ & services/
  │    │    │    ├── api.js             # HTTP Service ហៅទៅកាន់ Backend
  │    │    │    └── socket.js          # WebSocket Client (Socket.IO)
  │    │    ├── context/
  │    │    │    ├── AuthContext.jsx    # Real User Authentication (JWT)
  │    │    │    └── TrackingContext.jsx# Live GPS Geolocation & Room Management
  │    │    ├── components/
  │    │    │    ├── MapView.jsx        # Leaflet Satellite/Streets/Dark + Radar Markers
  │    │    │    ├── Navbar.jsx         # Mobile-Responsive Header (No text-wrapping)
  │    │    │    ├── AuthModal.jsx      # Cyber Glassmorphism Login & Register
  │    │    │    ├── ShareModal.jsx     # Share Link Generator & Native Share
  │    │    │    ├── AdminDashboard.jsx # Admin Panel (Stats, Live GPS Users, Revoke)
  │    │    │    ├── ActiveTrackersPanel.jsx # Connected Friends List & Distance
  │    │    │    └── HUDControls.jsx    # Cyber HUD Telemetry (Speed, Compass, Coordinates)
  │    │    ├── utils/
  │    │    │    ├── geoUtils.js        # Haversine distance, speed & bearing
  │    │    │    └── i18n.js            # Khmer & English Bilingual Dictionary
  │    │    ├── App.jsx
  │    │    └── index.css
  │    ├── .env                         # VITE_API_URL & VITE_SOCKET_URL
  │    ├── .env.example
  │    ├── index.html
  │    └── vite.config.js
  │
  └── package.json                      # Workspace Root Scripts
```

---

## 🔐 ការកំណត់ Firebase ក្នុង Backend `.env` (Secure Backend Setup)

លែងមានការបញ្ចូល Key លើអេក្រង់ UI ដូចកូនក្មេងទៀតហើយ! ព័ត៌មានសម្ងាត់ទាំងអស់ត្រូវបានការពារក្នុង **`backend/.env`** ដោយសុវត្ថិភាព៖

បើក file `backend/.env` រួចបំពេញព័ត៌មាន Firebase របស់អ្នក៖
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_here
FRONTEND_URL=http://localhost:5173

# Firebase Admin Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----\n"
```

*(ប្រសិនបើអ្នកមិនទាន់បានដាក់ Firebase Keys ទេ Backend នឹងដំណើរការលើ **Local Persistent Storage** ដោយស្វ័យប្រវត្ត ធានាថាមិនគាំង ឬ Error ឡើយ)*

---

## ⚡ របៀបដំណើរការ (How to Run)

### ជម្រើសទី ១: ដំណើរការ Backend
```bash
cd backend
npm run dev
```
👉 Backend API & WebSocket ដំណើរការលើ: **http://localhost:5000**

### ជម្រើសទី ២: ដំណើរការ Frontend
```bash
cd frontend
npm run dev
```
👉 Frontend Web App ដំណើរការលើ: **http://localhost:5173**
