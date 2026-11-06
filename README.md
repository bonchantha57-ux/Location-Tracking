# 🛰️ MAP TRACKING - Real-time GPS Geolocation & Group Movement Trails Platform

ប្រព័ន្ធតាមដាន និងចែករំលែកទីតាំងផ្ទាល់ក្នុងពេលជាក់ស្តែង (Real-time Live Location Tracking) ជាមួយមុខងារ **កត់ត្រាដានផ្លូវធ្វើដំណើរ (Movement Breadcrumb Trails)**, **Duo ២នាក់ (QR Code Scan)**, និង **Group Tracking** បង្កើតឡើងដោយប្រើប្រាស់ **Professional Fullstack Architecture** (React + Leaflet + Tailwind CSS + Node.js/Express + Socket.IO + Firebase Firestore) ដែលមានសុវត្ថិភាពខ្ពស់ និងរចនាឡើង 100% Mobile Responsive ទាំងលើ iOS (iPhone) និង Android។

---

## 📋 តម្រូវការប្រព័ន្ធ (System Requirements & Prerequisites)

ដើម្បីដំឡើង និងដំណើរការគម្រោងនេះបានរលូន សូមផ្ទៀងផ្ទាត់តម្រូវការផ្នែករឹង និងផ្នែកទន់ដូចខាងក្រោម៖

### ១. តម្រូវការផ្នែកទន់ (Software Prerequisites)
| ឧបករណ៍ / បច្ចេកវិទ្យា | កំណែដែលទាមទារ (Required Version) | ការពិពណ៌នា |
| :--- | :--- | :--- |
| **Node.js** | `>= 18.x` ឬ `>= 20.x LTS` (ណែនាំ) | Runtime សម្រាប់ដំណើរការ Backend និង Build Frontend |
| **npm** | `>= 9.x` ឬ `yarn` / `pnpm` | Package manager សម្រាប់ទាញយក Dependencies |
| **Git** | `>= 2.30+` | សម្រាប់ Version Control និង Push ទៅ GitHub |
| **Modern Browser** | Chrome, Safari (iOS 15+), Firefox, Edge | គាំទ្រ HTML5 Geolocation API, WebSockets, និង ES6+ |

### ២. តម្រូវការផ្នែកគណនី Cloud & Third-party Services
* **Firebase Project** (Google Cloud / Firebase Console):
  * **Firebase Authentication**: បើកដំណើរការ Email/Password និង Google Provider
  * **Cloud Firestore**: Database សម្រាប់កត់ត្រាទិន្នន័យ User, Groups, និង Movement Trails
  * **Firebase Service Account Key**: សម្រាប់ Backend Firebase Admin SDK
* **Render Account**: សម្រាប់ Deploy Backend Web Service (Node.js + WebSockets)
* **Vercel Account**: សម្រាប់ Deploy Frontend Single Page App (React + Vite)
* **HTTPS Protocol Requirement**: GPS / HTML5 Geolocation API **ទាមទារដាច់ខាតនូវ HTTPS** (លើ Vercel/Render គឺមាន SSL/HTTPS ស្វ័យប្រវត្ត) ទើប Browser អនុញ្ញាតឱ្យសុំសិទ្ធិទីតាំងបាន។

### ៣. តម្រូវការផ្នែករឹង និងឧបករណ៍ Client (Client Hardware Requirements)
* **ឧបករណ៍ចល័ត (Smartphones)**: 
  * iPhone / iPad (iOS 14.0 ឡើងទៅ) លើ Safari ឬ Chrome
  * Android Phone (Android 8.0 ឡើងទៅ) លើ Google Chrome
  * បើកមុខងារ Location / GPS (High Accuracy Mode) លើទូរស័ព្ទ
* **កុំព្យូទ័រ (Desktop / Laptop)**: គាំទ្រគ្រប់ OS (Windows, macOS, Linux)

---

## ✨ មុខងារចម្បងៗ (Core Features)

- 📍 **Real-time Live GPS Tracking**: តាមដានទីតាំងផ្ទាល់ ក្នុងវិនាទីជាក់ស្តែង ជាមួយសញ្ញា Radar Pulse និង Compass Heading។
- 🛤️ **Movement Breadcrumb Trails (ដានផ្លូវធ្វើដំណើរ)**:
  - កត់ត្រារាល់ការផ្លាស់ទីរបស់សមាជិកម្នាក់ៗ **ចាប់តាំងពីវិនាទីដែលបានចុចចូល Group/Duo**។
  - គូរខ្សែដានភ្លឺច្បាស់បែប Neon Glow លើផែនទី (Polyline) តាមពណ៌សម្គាល់សមាជិកម្នាក់ៗ។
  - បង្ហាញសញ្ញា **Start Pin `[S]`** នៅចំណុចចាប់ផ្តើម និងបង្ហាញម៉ោងពេលចុចលើវា។
  - គណនា **ចម្ងាយសរុប (Distance Traveled ជា km/m)** ដោយស្វ័យប្រវត្តិ។
  - ប៊ូតុង **`[ 🛤️ ដានផ្លូវ: បើក / បិទ ]`** លើផែនទី និងប៊ូតុង **`[ 🛤️ មើលដាន ]`** សម្រាប់ Auto-fit bounds ពង្រីកបង្ហាញដានផ្លូវទាំងអស់។
- 🔒 **Duo Tracking Mode (សម្រាប់តែ ២នាក់)**: បង្កើតបន្ទប់ឯកជនលក្ខណៈគូស្នេហ៍ ឬមិត្តភក្តិ ២នាក់ ជាមួយ QR Code និង Link ចុចចូលភ្លាមៗ។
- 👥 **Multi-Member Group Rooms**: បង្កើតបន្ទប់ក្រុមធំៗ (គ្រួសារ, ក្រុមទេសចរណ៍, ក្រុមការងារដឹកជញ្ជូន)។
- 📱 **100% Mobile Responsive (Zero Clipping)**:
  - ប្រើប្រាស់ `100dvh` ការពារកុំឱ្យបាត់ផ្នែកលើ ឬក្រោមលើ Android & iPhone។
  - គាំទ្រ Safe Area Insets (`env(safe-area-inset-bottom)`) មិនប៉ះទង្គិចជាមួយ Home Bar។
- 🗺️ **Multi-layer Map Tiles**: អាចប្តូរ Map បាន ៣ ប្រភេទ (OpenStreetMap, Esri World Satellite, CartoDB Dark Matter)។
- 🔐 **Dual-Mode Secure Authentication**: គាំទ្រទាំង Google Sign-In ដោយផ្ទាល់ និង Email/Password ជាមួយ JWT + bcryptjs។
- 🛡️ **God-view Admin Dashboard**: ផ្ទាំងគ្រប់គ្រង Admin មើលស្ថិតិសរុប និង Telemetry របស់ User ទាំងអស់លើផែនទី។

---

## 🏗️ រចនាសម្ព័ន្ធ Project (Clean Fullstack Architecture)

```
Maptrackking/
│
├── backend/                          # 🚀 BACKEND ENGINE (NODE.JS + SOCKET.IO)
│    ├── src/
│    │    ├── config/
│    │    │    └── firebaseAdmin.js   # Firebase Admin SDK & Trails Persistence
│    │    ├── controllers/
│    │    │    ├── authController.js     # Register, Login (JWT + bcryptjs)
│    │    │    ├── locationController.js # Room Tracking & Trails API
│    │    │    └── adminController.js    # Admin stats & God-view
│    │    ├── middleware/
│    │    │    └── authMiddleware.js     # JWT Verification Guard
│    │    ├── routes/
│    │    │    ├── authRoutes.js         # /api/auth/*
│    │    │    ├── locationRoutes.js     # /api/location/*
│    │    │    └── adminRoutes.js        # /api/admin/*
│    │    ├── sockets/
│    │    │    └── locationSocket.js     # WebSocket Realtime Stream & Trail Sync
│    │    └── server.js                  # Express Entry Point (0.0.0.0 Support)
│    ├── .env                         # Backend Environment Variables
│    ├── .env.example
│    └── package.json
│
├── frontend/                         # 🎨 FRONTEND CLIENT (REACT 18 + VITE)
│    ├── src/
│    │    ├── services/
│    │    │    ├── api.js             # Axios/Fetch REST API client
│    │    │    └── socket.js          # Socket.IO Client Connection
│    │    ├── context/
│    │    │    ├── AuthContext.jsx    # User State, Firebase Auth & JWT
│    │    │    └── TrackingContext.jsx# Live GPS, Trails, Duo & Rooms Manager
│    │    ├── components/
│    │    │    ├── MapView.jsx        # Leaflet, Markers, Glow Polylines & Trails
│    │    │    ├── Navbar.jsx         # Header responsive with status indicators
│    │    │    ├── AuthModal.jsx      # Glassmorphic Login/Register & Google Auth
│    │    │    ├── ShareModal.jsx     # Duo QR Code Generator & Room Invites
│    │    │    ├── ActiveTrackersPanel.jsx # Friends list, distance, & trail buttons
│    │    │    ├── HUDControls.jsx    # Telemetry HUD (Speed, Alt, Heading, Trails)
│    │    │    └── AdminDashboard.jsx # Admin management interface
│    │    ├── utils/
│    │    │    ├── geoUtils.js        # Haversine formula distance & bearings
│    │    │    └── i18n.js            # Khmer & English Translations
│    │    ├── config/
│    │    │    └── firebase.js        # Client-side Firebase App init
│    │    ├── App.jsx
│    │    └── main.jsx
│    ├── .env                         # Frontend Environment Variables
│    ├── .env.example
│    ├── index.html
│    ├── tailwind.config.js
│    └── vite.config.js
│
└── package.json                      # Root configuration
```

---

## ⚙️ ការកំណត់អថេរ Environment Variables

### ១. Backend Environment Variables (`backend/.env`)

| Variable | Type | Example | ការពិពណ៌នា |
| :--- | :--- | :--- | :--- |
| `PORT` | Number | `10000` | Port សម្រាប់ដំណើរការ Server (Render ប្រើ default `10000`) |
| `NODE_ENV` | String | `production` | បរិស្ថានដំណើរការ (`development` ឬ `production`) |
| `JWT_SECRET` | String | `super_secret_jwt_key_2026` | Key សម្ងាត់សម្រាប់ Sign និង Verify JSON Web Token |
| `FRONTEND_URL` | String | `https://location-tracking-lyart.vercel.app` | URL Frontend សម្រាប់អនុញ្ញាត CORS |
| `FIREBASE_PROJECT_ID` | String | `datareporttoduc` | Firebase Project ID |
| `FIREBASE_CLIENT_EMAIL` | String | `firebase-adminsdk-xxx@...iam.gserviceaccount.com` | Firebase Admin Service Account Email |
| `FIREBASE_PRIVATE_KEY` | String | `"-----BEGIN PRIVATE KEY-----\n..."` | Firebase Admin Private Key (មានសញ្ញា `\n`) |
| `FIREBASE_DATABASE_URL` | String | `https://...firebasedatabase.app` | Firebase Realtime DB URL (បើមាន) |

### ២. Frontend Environment Variables (`frontend/.env`)

> [!IMPORTANT]
> រាល់អថេរក្នុង Frontend ត្រូវតែផ្តើមដោយពាក្យ **`VITE_`** ទើប Vite Framework អាចទាញយកទៅប្រើប្រាស់បាន។

| Variable | Type | Example | ការពិពណ៌នា |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | String | `https://location-tracking-n6br.onrender.com/api` | API Base URL ទៅកាន់ Backend |
| `VITE_SOCKET_URL` | String | `https://location-tracking-n6br.onrender.com` | WebSocket Server URL |
| `VITE_FIREBASE_API_KEY` | String | `AIzaSy...` | Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | String | `datareporttoduc.firebaseapp.com` | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | String | `datareporttoduc` | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | String | `datareporttoduc.firebasestorage.app` | Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | String | `1234567890` | Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | String | `1:1234567890:web:abcdef` | Firebase Web App ID |

---

## ⚡ ការដំឡើង និងដំណើរការក្នុងម៉ាស៊ីន (Local Development Setup)

### ជំហានទី ១: Clone Repository
```bash
git clone https://github.com/bonchantha57-ux/Location-Tracking.git
cd Location-Tracking
```

### ជំហានទី ២: ដំឡើង និងដំណើរការ Backend
```bash
cd backend
npm install

# បង្កើត file .env តាមគំរូខាងលើ
# បន្ទាប់មក Start Backend
npm run dev
```
👉 Backend API & WebSocket នឹងដំណើរការលើ: **http://localhost:10000**

### ជំហានទី ៣: ដំឡើង និងដំណើរការ Frontend
បើក Terminal មួយទៀត៖
```bash
cd frontend
npm install

# បង្កើត file .env
# បន្ទាប់មក Start Frontend
npm run dev
```
👉 Frontend Web App នឹងដំណើរការលើ: **http://localhost:5173**

---

## 🌐 ការដាក់ពង្រាយលើ Production (Deployment Guide)

### ១. Deploy Backend លើ Render (Web Service)
1. ចូលទៅកាន់ [dashboard.render.com](https://dashboard.render.com) រួចចុច **New +** ➔ **Web Service**
2. ភ្ជាប់ជាមួយ GitHub Repository: `Location-Tracking`
3. កំណត់ Settings:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Region**: `Singapore (Southeast Asia)`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
4. នៅក្នុងផ្ទាំង **Environment Variables** បញ្ចូលអថេរ `JWT_SECRET`, `FRONTEND_URL`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`។
5. ចុច **Deploy Web Service**។

### ២. Deploy Frontend លើ Vercel
1. ចូលទៅកាន់ [vercel.com](https://vercel.com) រួចចុច **Add New...** ➔ **Project**
2. ជ្រើសរើស GitHub Repo: `Location-Tracking`
3. កំណត់ Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
4. នៅក្នុងផ្ទាំង **Environment Variables** បញ្ចូលអថេរទាំងអស់ដែលផ្តើមដោយ `VITE_*` (ដូចមានរៀបរាប់ក្នុងតារាង Frontend ខាងលើ)។
5. ចុច **Deploy**។

### ៣. បន្ថែម Domain ក្នុង Firebase Authorized Domains
- ចូលទៅកាន់ **Firebase Console** ➔ **Authentication** ➔ **Settings** ➔ **Authorized domains**
- ចុច **Add domain** រួចបញ្ចូល Domain របស់ Vercel (ឧទាហរណ៍: `location-tracking-lyart.vercel.app`) ដើម្បីអនុញ្ញាតឱ្យដំណើរការ Google Sign-In។

---

## 📡 ឯកសារយោង API & WebSocket Events

### REST API Endpoints
* `POST /api/auth/register` - ចុះឈ្មោះគណនីថ្មី
* `POST /api/auth/login` - ចូលប្រើប្រាស់គណនី (ទទួលបាន JWT Token)
* `POST /api/auth/firebase-login` - Sync គណនី Google Firebase ជាមួយ Backend
* `GET /api/location/group/:groupId` - មើលព័ត៌មានបន្ទប់ និងសមាជិក
* `GET /api/location/group/:groupId/trails` - ទាញយកទិន្នន័យដានផ្លូវធ្វើដំណើរទាំងអស់ក្នុងបន្ទប់
* `GET /api/health` - ត្រួតពិនិត្យសុខភាព Server (Health Check)

### WebSocket Real-time Events
* `send_location` (Client ➔ Server): ផ្ញើកូអរដោនេ (lat, lng, speed, heading, altitude)
* `location_update` (Server ➔ Client): ចែករំលែកទីតាំងផ្ទាល់ទៅកាន់សមាជិកក្នុងបន្ទប់
* `join_group` (Client ➔ Server): ចូលរួមបន្ទប់ Group ឬ Duo
* `group_trails_sync` (Server ➔ Client): ផ្តល់ទិន្នន័យដានផ្លូវចាស់ៗទាំងអស់ជូនសមាជិកដែលទើបចូល
* `group_trail_point` (Server ➔ Client): បញ្ជូនចំណុចដានផ្លូវថ្មីមួយៗ Real-time ទៅកាន់សមាជិកទាំងអស់

---

## 👨‍💻 អ្នកអភិវឌ្ឍន៍ (Author & Credits)

* **Repository**: [bonchantha57-ux/Location-Tracking](https://github.com/bonchantha57-ux/Location-Tracking)
* **Frontend App**: [location-tracking-lyart.vercel.app](https://location-tracking-lyart.vercel.app)
* **Backend Cloud**: [location-tracking-n6br.onrender.com](https://location-tracking-n6br.onrender.com)
* **License**: MIT License
