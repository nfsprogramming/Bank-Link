# 🏦 BankLink | Modern Wealth & Loan Management

Welcome to **BankLink**, a premium, private banking and loan management platform. Engineered for scale and designed with a modern aesthetic, BankLink delivers an exceptional user experience for both financial administrators and their clients.

## 🚀 Tech Stack

- **Frontend**: React (Vite)
- **Styling**: Tailwind CSS v4 (Custom Design System with Dark Mode support)
- **Backend & Auth**: Firebase (Authentication + Firestore + Storage)
- **Icons**: Lucide React
- **Animations**: CSS Transitions & Custom Keyframes (Neo-brutalist 3D interactions)

---

## ✨ Key Features

### 💎 Premium Design System
- **Dark Mode Support**: Seamlessly toggle between Light and Dark themes via Settings.
- **Neo-Brutalist UI**: Modern 3D interactive buttons, sharp drop shadows, and solid borders.
- **Responsive Architecture**: An intelligent Sidebar and Header system (`AppShell`) that adapts perfectly from mobile devices to ultra-wide displays.
- **Custom Branding**: Fully integrated geometric SVG Logo and bespoke loaders.

### 🔐 Authentication & Security
- **Role-Based Access Control (RBAC)**: Secure routing separating `admin` and `user` portals.
- **Protected Routes**: Firebase Auth integration ensures unauthorized access is blocked instantly.

### 📊 Admin capabilities
- **Comprehensive Dashboards**: View key KPIs including Total Outstanding Loans, Active Customers, and Revenue.
- **Customer Management**: Detailed tables displaying customer profiles, total active/completed loans, and direct contact details.
- **Loan Approvals Engine**: One-click Approve/Reject workflows with instant state updates.
- **Activity Feed**: Real-time event logging for loan creations, payment collections, and user registrations.
- **Command Palette**: Press `Ctrl + K` anywhere to instantly search across the entire platform and navigate rapidly.
- **Live Notifications**: Integrated dropdown in the header highlighting pending loan applications and recently received payments.

### 📁 Document Vault
- **Firebase Storage Integration**: Securely upload, view, and manage KYC documents, loan agreements, and financial statements.
- **Drag & Drop Interface**: Seamless file management built directly into the dashboard.

---

## 🚀 Getting Started

### 1. 🔑 Firebase Setup
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project (e.g., `banklink-core`).
3. **Authentication**: Enable **Email/Password**.
4. **Firestore Database**: Create a database (start in "Test Mode" for local dev).
5. **Storage**: Enable Firebase Storage.
6. **Configuration**: Copy your `firebaseConfig` object and paste it into `src/firebase.js`.

### 2. 👥 Creating an Admin
By default, every new user is registered with the **`user`** role. To elevate an account to Admin:
1. Open the **Firestore Database** in the Firebase Console.
2. Find the `users` collection.
3. Locate the document for the desired user UID.
4. Change the `role` field from `"user"` to **`"admin"`**.

### 3. 🛠 Running Locally
```powershell
npm install
npm run dev
```

---

## 📂 Project Structure
- `src/components/` - Core UI elements (`AppShell`, `Sidebar`, `Header`, `CommandPalette`, `Logo`).
- `src/pages/` - Main application views spanning Admin controls, Customer workflows, and Settings.
- `src/services/` - Utility functions (e.g., `financial.js` for currency formatting and EMI calculation).
- `src/firebase.js` - Centralized Firebase initialization.
- `src/index.css` - Core design variables, CSS custom properties for Dark Mode, and utility classes.

---
*Built for the future of finance.*
