# 🏢 OfficeSync

### The Operating System for the Modern Workplace

![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/status-production-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![Tech](https://img.shields.io/badge/stack-React%2BExpress%2BFirebase-red?style=for-the-badge)

**OfficeSync** is a full-stack workplace management solution that digitizes beverage ordering and internal communications. Built with React, Express, and Firebase.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [License](#-license)

---

## ✨ Features

### ☕ Beverage Ordering System
| Feature | Description |
|---------|-------------|
| **Time-Based Ordering** | Morning (before 10:30 AM) and Evening (3:00-5:30 PM) slots |
| **One Order Per Slot** | Users can only order once per slot; re-ordering updates the choice |
| **Real-time Stats** | Live counters for Tea, Coffee, and Juice orders |
| **Order History** | Paginated history with filtering by type |

### 📌 Notice Board
| Feature | Description |
|---------|-------------|
| **Announcements** | Admin can post General, Important, Urgent, or Holiday notices |
| **Live Polling** | Create polls with 2-6 options; users can vote and change votes |
| **Admin Controls** | Edit, delete, and pin notices |

### 📊 Admin Dashboard
| Feature | Description |
|---------|-------------|
| **7-Day Analytics** | Trend charts and distribution visualization |
| **Reset Stats** | Clear today's order counts with one click |
| **Role-Based Access** | Only admins can access admin features |

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **React Router 7** - Routing
- **Tailwind CSS 4** - Styling
- **Vite 7** - Build tool
- **Axios** - HTTP client
- **Firebase Auth** - Authentication

### Backend
- **Express 5** - Web framework
- **Firebase Admin SDK** - Server-side Firebase
- **Helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **express-validator** - Input validation

### Database
- **Cloud Firestore** - NoSQL database

---

## 📁 Project Structure

```
Office-Sync-app/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── CountdownTimer.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── NoticeBoard.jsx
│   │   │   └── Toast.jsx
│   │   ├── contexts/          # React contexts
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/             # Custom hooks
│   │   ├── pages/             # Route pages
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── OrderHistory.jsx
│   │   │   └── Profile.jsx
│   │   ├── utils/             # Utilities
│   │   │   └── api.js         # API service layer
│   │   ├── App.jsx            # Main app component
│   │   ├── config.js          # Configuration
│   │   └── firebase.js        # Firebase client config
│   ├── package.json
│   └── vite.config.js
│
├── server/                    # Express backend
│   ├── middleware/
│   │   ├── auth.js            # Token verification
│   │   ├── rateLimit.js       # Rate limiting
│   │   └── validation.js      # Input validation
│   ├── scripts/
│   │   └── setupFirebase.js   # Admin setup script
│   ├── index.js               # Main server file
│   ├── package.json
│   └── .env.example
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm or pnpm
- Firebase project with Auth & Firestore enabled

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Office-Sync-app
```

### 2. Setup Server
```bash
cd server
npm install

# Copy environment template
cp .env.example .env

# Add your Firebase service account key
# Download from Firebase Console > Project Settings > Service Accounts
```

### 3. Setup Client
```bash
cd client
npm install

# Update src/config.js with your API URL
# Update src/firebase.js with your Firebase config
```

### 4. Run Development
```bash
# Terminal 1 - Server
cd server
node index.js

# Terminal 2 - Client
cd client
npm run dev
```

---

## 🔐 Environment Variables

### Server (`server/.env`)
| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 5000) | No |
| `CLIENT_URL` | Allowed CORS origin | Yes (prod) |
| `NODE_ENV` | `development` or `production` | No |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to Firebase credentials | Yes |

### Client (`client/src/config.js`)
| Variable | Description |
|----------|-------------|
| `API_BASE_URL` | Backend API URL |

---

## 📡 API Documentation

### Authentication
All protected routes require `Authorization: Bearer <firebase-id-token>` header.

### Orders

#### Place Order
```http
POST /api/order
```
| Field | Type | Description |
|-------|------|-------------|
| `type` | string | `tea`, `coffee`, or `juice` |
| `userId` | string | Firebase UID |
| `email` | string | User email |

**Response:**
```json
{ "success": true, "message": "tea ordered!" }
```

#### Get Today's Stats
```http
GET /api/stats
```
**Response:**
```json
{ "tea": 5, "coffee": 3, "juice": 2 }
```

#### Get User Order History
```http
GET /api/orders/user/:userId?limit=20&offset=0&type=all
```

#### Reset Today's Stats (Admin)
```http
DELETE /api/stats/reset
```

### Notices

#### Get Notices
```http
GET /api/notices?limit=5&offset=0
```

#### Create Notice (Admin)
```http
POST /api/notices
```
| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Notice title (3-100 chars) |
| `message` | string | Notice content (max 1000 chars) |
| `type` | string | `general`, `important`, `urgent`, `holiday`, `poll` |
| `pollOptions` | array | Optional, 2-6 poll options |

#### Update Notice (Admin)
```http
PUT /api/notices/:id
```

#### Delete Notice (Admin)
```http
DELETE /api/notices/:id
```

#### Vote on Poll
```http
POST /api/notices/:id/vote
```
| Field | Type | Description |
|-------|------|-------------|
| `optionIndex` | number | Index of selected option (or `null` to remove vote) |

### Admin

#### Get Admin Stats
```http
GET /api/admin/stats
```
Returns 7-day order statistics.

---

## 🚢 Deployment

### Build Client
```bash
cd client
npm run build
# Output: client/dist/
```

### Production Server
```bash
cd server
NODE_ENV=production CLIENT_URL=https://your-domain.com node index.js
```

### Recommended Hosting
- **Frontend**: Vercel, Netlify, or Firebase Hosting
- **Backend**: Railway, Render, or Google Cloud Run

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.
