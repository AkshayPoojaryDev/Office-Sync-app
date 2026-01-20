# OfficeSync 🏢

**OfficeSync** is a modern, full-stack office management application designed to streamline daily office activities. It features a beverage ordering system, an interactive digital noticeboard with polls, and comprehensive admin analytics.

![OfficeSync Dashboard](https://via.placeholder.com/800x400?text=OfficeSync+Dashboard)

## 🚀 Key Features

### ☕ Beverage Ordering
- **Smart Slots**: Ordering is available during specific morning (before 10:30 AM) and evening (3:00 PM - 5:30 PM) windows.
- **Card Interface**: Beautiful, animated cards for Tea, Coffee, and Juice.
- **Limits**: Daily limit enforcement (1 cup per slot).

### 📌 Interactive NoticeBoard
- **Digital Corkboard**: Announcements appear as realistic sticky notes with pushpins and folded corners.
- **Polls**: Integrated polling system with real-time voting, vote changes, and visual progress bars.
- **Admin Controls**: Admins can pin, edit, and delete notices directly from the board.

### 📊 Dashboards & Analytics
- **User Profile**: Personal stats, favorite beverage detection, and role badges.
- **Order History**: Paginated, filterable history of all user orders with CSV export.
- **Admin Dashboard**: 7-day trend analysis and consumption breakdown.

### 🌗 Modern UI/UX
- **Dark Mode**: Fully integrated dark theme controlled by a system-wide toggle.
- **Responsive**: Mobile-first design using Tailwind CSS.
- **Performance**: Optimized with code splitting (Lazy Loading) and efficient server-side pagination.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Tailwind CSS v4, Framer Motion (animations), React Router v6.
- **Backend**: Node.js, Express.js.
- **Database & Auth**: Firebase Firestore, Firebase Authentication.
- **Tools**: Axios, React Hot Toast, Heroicons.

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- Firebase Project with Firestore and Auth enabled.

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/office-sync.git
cd office-sync
```

### 2. Server Setup
Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```

**Configuration**:
1. Place your Firebase Admin SDK key (`serviceAccountKey.json`) in the `server/` root.
2. Create a `.env` file in `server/` with:
   ```env
   PORT=5000
   ```
3. Run the setup script to initialize Firestore limits (optional):
   ```bash
   node scripts/setupFirebase.js
   ```
4. Start the server:
   ```bash
   node index.js
   ```

### 3. Client Setup
Open a new terminal, navigate to the client directory, and install dependencies:
```bash
cd client
npm install
```

**Configuration**:
Create a `.env` file in `client/` with your Firebase config:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_BASE_URL=http://localhost:5000
```

Start the development server:
```bash
npm run dev
```

---

## 🧪 Testing

The application includes a robust testing report covering:
- ✅ Scalability (pagination for 100+ items)
- ✅ Dark Mode coverage
- ✅ Poll functionality (voting/unvoting)

For a detailed verification report, check `testing_report.md` in the documentation.

---

## 📄 License

This project is licensed under the MIT License.
