# Firebase Setup Guide

## Required Collections

The OfficeSync app requires the following Firestore collections:

### 1. `users`
Stores user profiles and role information.

| Field | Type | Description |
|-------|------|-------------|
| email | string | User's email address |
| role | string | Either `'user'` or `'admin'` |
| displayName | string | User's display name |
| createdAt | string | ISO timestamp |
| lastLogin | string | ISO timestamp |

**Admin Check**: Users with `role: 'admin'` have access to:
- Admin Dashboard (`/admin`)
- Post/Edit/Delete announcements
- View admin statistics

### 2. `daily_stats`
Stores daily beverage order statistics. Document ID is the date (YYYY-MM-DD).

| Field | Type | Description |
|-------|------|-------------|
| tea | number | Tea order count |
| coffee | number | Coffee order count |
| juice | number | Juice order count |
| orders | array | Array of order objects |
| lastUpdated | string | ISO timestamp |

### 3. `notices`
Stores office announcements.

| Field | Type | Description |
|-------|------|-------------|
| title | string | Announcement title |
| message | string | Announcement content |
| author | string | Author email |
| authorName | string | Author display name |
| type | string | `'general'`, `'important'`, `'urgent'`, `'holiday'` |
| isPinned | boolean | Whether pinned to top |
| timestamp | string | Created ISO timestamp |
| updatedAt | string | Updated ISO timestamp |

---

## Setup Instructions

### 1. Run the Setup Script

```bash
cd server
node scripts/setupFirebase.js
```

This will:
- Check if required collections exist
- Initialize empty collections with sample data
- List current admin users

### 2. Set an Admin User

First, the user must log in to the app at least once (to create their Firebase Auth account).

Then run:
```bash
node scripts/setupFirebase.js user@example.com
```

This will set the specified user as an admin.

### 3. Verify Admin Access

After setting admin:
1. Log out and log back in
2. You should see "Administrator" under your name in the sidebar
3. You should see the "Admin Panel" navigation item
4. You can now post, edit, and delete announcements

---

## Manual Admin Setup (Alternative)

If you prefer to set admin manually via Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Firestore Database**
4. Navigate to `users` collection
5. Find the user document (by UID)
6. Edit the `role` field from `user` to `admin`
7. Save changes
