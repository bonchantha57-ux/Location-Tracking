# 🛰️ MAP TRACKING - Real-time GPS Geolocation & Group Movement Trails Platform

ប្រព័ន្ធតាមដាន និងចែករំលែកទីតាំងផ្ទាល់ក្នុងពេលជាក់ស្តែង (**Real-time Live Location Tracking**) ជាមួយមុខងារ **កត់ត្រាដានផ្លូវធ្វើដំណើរ (Movement Breadcrumb Trails)**, **Duo ២នាក់ (QR Code Scan)**, និង **Group Tracking** បង្កើតឡើងដោយប្រើប្រាស់ **Professional Fullstack Architecture** (React + Leaflet + Tailwind CSS + Node.js/Express + Socket.IO + Firebase Firestore) ដែលមានសុវត្ថិភាពខ្ពស់ និងរចនាឡើង 100% Mobile Responsive ទាំងលើ iOS (iPhone) និង Android។

---

## 📋 សេចក្តីលម្អិតនៃលក្ខខណ្ឌតម្រូវការប្រព័ន្ធ (Software Requirements Specification - SRS)

### ១. តម្រូវការមុខងារចម្បង (Functional Requirements - FR)

#### 🔐 FR-1: ការគ្រប់គ្រងគណនី និងសិទ្ធិប្រើប្រាស់ (User Authentication & Profile)
* **FR-1.1 (Dual-Engine Authentication):** គាំទ្រការ Sign-in តាមរយៈ Google One-Click Auth (Firebase Auth) និង Email/Password ផ្ទាល់ជាមួយ Backend Database (JWT + bcryptjs)។
* **FR-1.2 (Persistent Login Session):** រក្សាទុក Login Session ជាប់ជានិច្ច មិនបាត់បង់ពេល Refresh ទំព័រ ឬបិទបើក Tab ឡើយ លុះត្រាតែ User ចុចប៊ូតុង "ចាកចេញ" (Logout) ដោយផ្ទាល់។
* **FR-1.3 (Clean & Instant Logout):** ពេល User ចុច Logout ប្រព័ន្ធនឹងសម្អាត JWT, គណនី, ទិន្នន័យ Group, Trails និងបិទ Socket Connection ភ្លាមៗ ១០០% ដោយមិនបាច់ Refresh ឡើយ។
* **FR-1.4 (User Profile Customization):** User អាចកែប្រែ Display Name និងរូបតំណាង Avatar របស់ខ្លួនបានតាមចិត្តគ្រប់ពេលវេលា។
* **FR-1.5 (Real-time Display Name on Map Marker):** បង្ហាញឈ្មោះគណនីរបស់ User និងមិត្តភក្តិដោយផ្ទាល់នៅលើ Marker ផែនទី ដើម្បីងាយស្រួលសម្គាល់ថាអ្នកណាជានរណា។

#### 📍 FR-2: ការតាមដានទីតាំង និងដានផ្លូវធ្វើដំណើរ (Real-time Live GPS & Movement Trails)
* **FR-2.1 (Live Geolocation Stream):** ផ្សាយផ្ទាល់កូអរដោនេ GPS តាមរយៈ WebSockets (Socket.IO) ជាមួយរយៈកម្ពស់ (Altitude), ទិសដៅ (Heading), ល្បឿន (Speed) និងកម្រិតជាក់លាក់ (Accuracy) ក្នុងកម្រិត Sub-second (< 200ms)។
* **FR-2.2 (Movement Breadcrumb Trails):** កត់ត្រា និងគូរដានផ្លូវធ្វើដំណើរ (Trails) របស់សមាជិកម្នាក់ៗចាប់តាំងពីពេលដែលបានចុចចូលរួមក្នុង Group ឬ Duo។
* **FR-2.3 (Visual Glow Polyline):** គូរខ្សែដានផ្លូវបែប Neon Glow លើផែនទីតាមពណ៌សម្គាល់សមាជិកនីមួយៗ ជាមួយ Start Pin `[S]` បញ្ជាក់ម៉ោងចាប់ផ្តើមដំណើរ។
* **FR-2.4 (Distance Calculation):** គណនាផលបូកចម្ងាយសរុប (Total Traveled Distance) ដែលបានធ្វើដំណើរជា គីឡូម៉ែត្រ (km) ឬ ម៉ែត្រ (m) ដោយស្វ័យប្រវត្តិ។
* **FR-2.5 (Trail Controls):** ប៊ូតុងបើក/បិទដានផ្លូវលើ Map និងប៊ូតុង Auto-fit Bounds ដើម្បីពង្រីកផែនទីមើលដានផ្លូវទាំងមូលរបស់សមាជិកដែលបានជ្រើសរើស។

#### 👥 FR-3: ការគ្រប់គ្រងបន្ទប់ និងការការពារភាពឯកជន (Room Management & Privacy Isolation)
* **FR-3.1 (Auto-generated Unique Room IDs):** ប្រព័ន្ធបង្កើត Room ID និង Duo ID ដោយស្វ័យប្រវត្ត (ឧ. `GP-8492`, `DUO-1934`) ដើម្បីធានាថាមិនមានការវាយ ID ជាន់គ្នា ឬស្ទួនគ្នាឡើយ។
* **FR-3.2 (2-Person Duo Mode):** បន្ទប់ឯកជន ២នាក់ កម្រិតអតិបរមា ២នាក់ ជាមួយ QR Code Scan និង Invite Link ចុចចូលភ្លាមៗ។
* **FR-3.3 (Multi-member Group Mode):** បន្ទប់ក្រុមធំៗសម្រាប់គ្រួសារ ឬក្រុមការងារ (រហូតដល់ ៥០នាក់)។
* **FR-3.4 (Multi-Group Switching):** សមាជិកអាចចូលរួមច្រើនក្រុមក្នុងពេលតែមួយ ហើយអាចចុចប្តូរមើលទីតាំងសមាជិកតាមក្រុមនីមួយៗលើផែនទីបានយ៉ាងងាយស្រួល។
* **FR-3.5 (Group Owner Kick/Remove):** អ្នកបង្កើតបន្ទប់ (Room Owner) មានសិទ្ធិដក (Kick/Remove) សមាជិកណាម្នាក់ចេញពីក្រុមបានភ្លាមៗ។
* **FR-3.6 (Strict Group Isolation / Privacy Guarantee):** User ធម្មតាអាចមើលឃើញទីតាំងតែសមាជិកដែលស្ថិតក្នុងក្រុមតែមួយជាមួយគ្នាប៉ុណ្ណោះ ដាច់ខាតមិនអាចមើលឃើញ User ដទៃដែលមិនបានចែករំលែក ឬមិនស្ថិតក្នុងក្រុមឡើយ។

#### 🛡️ FR-4: ផ្ទាំងគ្រប់គ្រងអ្នកគ្រប់គ្រងជាន់ខ្ពស់ (Admin God-View Dashboard & Controls)
* **FR-4.1 (Dedicated Admin Authentication):** ផ្ទៀងផ្ទាត់ Email & Password Admin ផ្ទាល់ពី Backend Database ដោយសុវត្ថិភាព។
* **FR-4.2 (Live Online & Total User Telemetry):** បង្ហាញស្ថិតិសរុបនៃចំនួន User ក្នុង Database និងចំនួន User ដែលកំពុង Online ចែករំលែកទីតាំងជាក់ស្តែង។
* **FR-4.3 (User Management CRUD):** Admin អាចបង្កើត Account User ថ្មី, កែប្រែព័ត៌មាន (Display Name, Email, Role) និងលុប Account User ពី Database បាន។
* **FR-4.4 (God-View Map Tracking):** Admin មានសិទ្ធិពិសេសតែម្នាក់គត់ (God-View) ដែលអាចមើលឃើញទីតាំងរបស់ User ទាំងអស់ក្នុងប្រព័ន្ធលើផែនទី និងអាចចុច Locate User នីមួយៗបានភ្លាមៗ។
* **FR-4.5 (All Groups Visibility):** Admin អាចមើលឃើញគ្រប់ Group/Duo ទាំងអស់ដែល User បានបង្កើតឡើងក្នុងប្រព័ន្ធ។

#### 🎨 FR-5: ទំនុកចិត្ត និងបទពិសោធន៍អ្នកប្រើប្រាស់ (Reliability & UX)
* **FR-5.1 (React ErrorBoundary):** ការពារ និងទប់ស្កាត់កុំឱ្យកើតមានផ្ទាំងខៀវងងឹត ឬ Blank Screen ដោយមានផ្ទាំងជូនដំណឹង និងប៊ូតុង Reload/Reset កម្មវិធីយ៉ាងច្បាស់លាស់។
* **FR-5.2 (Custom Brand Vector Logo):** ឡូហ្គោផែនទីផ្កាយរណបទំនើប (Cyan & Blue Glow Vector) ទាំងលើ Navbar, Modal និង Favicon។
* **FR-5.3 (100% Mobile Responsive):** រចនាឡើងការពារកុំឱ្យបាត់បង់ប៊ូតុង ឬកាត់ផ្នែកខាងក្រោម (Zero Cutoff ជាមួយ `100dvh` និង iOS Safe Area Insets)។
* **FR-5.4 (Bilingual Khmer/English):** គាំទ្រទាំងស្រុងជាភាសាខ្មែរ (Default) និងភាសាអង់គ្លេស។

---

### ២. តម្រូវការមិនមែនមុខងារ (Non-Functional Requirements - NFR)

| ប្រភេទតម្រូវការ | កម្រិតស្តង់ដារ | ការពិពណ៌នាលម្អិត |
| :--- | :--- | :--- |
| **NFR-1: សុវត្ថិភាព (Security)** | HTTPS & Data Protection | GPS / HTML5 Geolocation API **ទាមទារដាច់ខាតនូវ HTTPS (SSL)**។ ពាក្យសម្ងាត់ត្រូវបាន Hash ដោយ `bcryptjs` (Salt Rounds 10) និងការពារ REST API ដោយ JSON Web Token (`jwt`)។ |
| **NFR-2: ល្បឿន និងប្រសិទ្ធភាព (Performance)** | Latency < 200ms | ផ្សាយផ្ទាល់ទីតាំងតាម WebSocket (Socket.IO Binary Protocol) ដែលមានល្បឿនលឿន និងស៊ី Bandwidth តិចបំផុត។ គណនាចម្ងាយដោយរូបមន្ត Haversine Formula។ |
| **NFR-3: ភាពអាចជឿជាក់បាន (Reliability)** | 99.9% Uptime & Fallback | មានប្រព័ន្ធ React `ErrorBoundary`, Graceful Error Handling, និង Reconnect ស្វ័យប្រវត្តពេលដាច់អ៊ីនធឺណិត។ |
| **NFR-4: ភាពងាយស្រួលប្រើប្រាស់ (Usability)** | 100% Mobile Friendly | Font អក្សរខ្មែរស្រស់ស្អាត (Kantumruy Pro) និង Plus Jakarta Sans, មិនបាំង Home Bar លើ iPhone, មិនបាច់ដំឡើង App ពី App Store/Play Store (Web App ដំណើរការភ្លាមៗ)។ |

---

## 💻 តម្រូវការផ្នែករឹង និងផ្នែកទន់ (System Prerequisites)

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
│    │    │    ├── ErrorBoundary.jsx  # React Error Boundary Safeguard
│    │    │    ├── MapView.jsx        # Leaflet, Markers, Glow Polylines & Trails
│    │    │    ├── Navbar.jsx         # Header responsive with status indicators
│    │    │    ├── AuthModal.jsx      # Glassmorphic Login/Register & Google Auth
│    │    │    ├── ProfileModal.jsx   # Profile Name & Avatar Customizer
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
│    ├── public/
│    │    ├── logo.svg                # Brand Vector Logo
│    │    └── favicon.svg             # Web App Favicon
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
* `PUT /api/auth/profile` - កែប្រែព័ត៌មាន Display Name និង Avatar
* `GET /api/location/group/:groupId` - មើលព័ត៌មានបន្ទប់ និងសមាជិក
* `GET /api/location/group/:groupId/trails` - ទាញយកទិន្នន័យដានផ្លូវធ្វើដំណើរទាំងអស់ក្នុងបន្ទប់
* `DELETE /api/location/group/:groupId/members/:memberUid` - Kick / Remove សមាជិកចេញពីបន្ទប់
* `GET /api/admin/stats` - ស្ថិតិទូទៅ User Online & Total Users
* `GET /api/admin/users` - ទាញយកបញ្ជី User ទាំងអស់ក្នុង Database
* `POST /api/admin/users` - Admin បង្កើតគណនី User ថ្មី
* `DELETE /api/admin/users/:uid` - Admin លុប User ចេញពី Database
* `GET /api/health` - ត្រួតពិនិត្យសុខភាព Server (Health Check)

### WebSocket Real-time Events
* `send_location` (Client ➔ Server): ផ្ញើកូអរដោនេ (lat, lng, speed, heading, altitude)
* `group_location_update` (Server ➔ Client): ចែករំលែកទីតាំងផ្ទាល់ទៅកាន់សមាជិកក្នុងបន្ទប់
* `join_group` (Client ➔ Server): ចូលរួមបន្ទប់ Group ឬ Duo
* `leave_group` (Client ➔ Server): ចាកចេញពីបន្ទប់ Group ឬ Duo
* `group_trails_sync` (Server ➔ Client): ផ្តល់ទិន្នន័យដានផ្លូវចាស់ៗទាំងអស់ជូនសមាជិកដែលទើបចូល
* `group_trail_point` (Server ➔ Client): បញ្ជូនចំណុចដានផ្លូវថ្មីមួយៗ Real-time ទៅកាន់សមាជិកទាំងអស់
* `update_profile` (Client ➔ Server): ផ្សាយដំណឹងប្តូរឈ្មោះ/Avatar ទៅសមាជិកក្នុង Group ភ្លាមៗ

---

## 👨‍💻 អ្នកអភិវឌ្ឍន៍ (Author & Credits)

* **Repository**: [bonchantha57-ux/Location-Tracking](https://github.com/bonchantha57-ux/Location-Tracking)
* **Frontend App**: [location-tracking-lyart.vercel.app](https://location-tracking-lyart.vercel.app)
* **Backend Cloud**: [location-tracking-n6br.onrender.com](https://location-tracking-n6br.onrender.com)
* **License**: MIT License
