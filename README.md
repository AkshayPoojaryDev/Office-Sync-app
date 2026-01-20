# 🏢 OfficeSync
### The Operating System for the Modern Workplace

![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/status-maintenance-orange?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![Tech](https://img.shields.io/badge/stack-MERN%2BFirebase-red?style=for-the-badge)

**OfficeSync** is a full-stack solution designed to bridge the gap between physical office needs and digital management. By digitizing beverage procurement and internal communications, OfficeSync reduces administrative friction and enhances workplace culture through a responsive, real-time interface.

---

## 📸 Screenshots

| **Dashboard (Glassmorphism)** | **Notice Board (Paper/Cork)** |
|:---:|:---:|
| ![Dashboard](https://via.placeholder.com/400x200/4F46E5/FFFFFF?text=Dashboard+Stats) | ![Noticeboard](https://via.placeholder.com/400x200/F59E0B/FFFFFF?text=Sticky+Notes) |
| *Real-time analytics & Quick Actions* | *Interactive polls & pinned notices* |

---

## 🚀 Key Features

### ☕ Intelligent Beverage Logistics
- **Smart Time-Windows**: Server-side validation prevents ordering outside specific windows (Morning < 10:30 AM, Evening 3:00-5:30 PM).
- **Concurrency Control**: Firestore transactions ensure inventory accuracy even when multiple users order simultaneously.
- **Quick Re-order**: One-tap ordering based on your most frequent customization.

### 📌 The Digital Corkboard
- **Skeuomorphic Design**: "Sticky notes" with CSS-generated folded corners and pushpins.
- **Live Polling**: Real-time visualization of votes with duplicate-vote prevention.
- **Admin Controls**: Pin, lock, or delete threads instantly.

### 📊 Admin Analytics
- **Consumption Trends**: 7-day rolling average of beverage consumption.
- **Export Data**: One-click CSV export for monthly billing and vendor management.
- **User Management**: Role-based access control (RBAC) to manage staff and admins.

---

## 🏗️ Architecture

OfficeSync uses a **Hybrid Serverless** approach. Auth and DB are managed by Firebase for scalability, while complex business logic resides in an Express server.

```mermaid
graph TD
    Client[React Client] -->|Auth Token| Auth[Firebase Auth]
    Client -->|REST API| Server[Node/Express Server]
    Client -->|Real-time| DB[(Firestore)]
    Server -->|Admin SDK| DB
    Server -->|Validation| DB
