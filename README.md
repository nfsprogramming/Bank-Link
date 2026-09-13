# 🏦 BankLink | Loan Management System

Welcome to the **BankLink** Bank Loan Management System. This project is built using:
- **Frontend**: React (Vite)
- **Styling**: Tailwind CSS v4 (Premium Design System)
- **Backend & Auth**: Firebase (Authentication + Firestore)
- **Icons**: Lucide React

---

## 🚀 Getting Started

### 1. 🔑 Firebase Setup (Crucial)
1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Create a new project (e.g., `bank-loan-mgmt`).
3.  **Authentication**: Enable **Email/Password** provider.
4.  **Firestore Database**: Create a database (start in "Test Mode" for development).
5.  **Project Settings**: Copy your `firebaseConfig` object and paste it into `src/firebase.js`.

### 2. 👥 User Roles & Access
By default, every new user is registered with the **`user`** role.
To make a user an **Admin**:
1.  Go to the **Firestore Database** in Firebase Console.
2.  Find the `users` collection.
3.  Locate the document for that user (by UID).
4.  Change the `role` field from `"user"` to **`"admin"`**.

### 3. 🛠 Running Locally
```powershell
npm install
npm run dev
```

---

## 🏗 Features

### 👤 User Portal
- **Dashboard**: High-level overview of total applications, approved and pending status.
- **Loan Application**: Clean form with validation, purpose selection, and period/tenure.
- **Loan Status**: Real-time list of submitted applications with status badges.
- **EMI Estimation**: Intelligent estimation for monthly payments on every loan card.

### 🛡️ Admin Portal
- **Overview Stats**: Total requested vs approved capital, pending urgency.
- **Application Oversight**: Review all incoming applications from all users.
- **Approval Engine**: One-click Approve/Reject with instant status updates for the user.
- **Real-time Live View**: Uses Firestore snapshots for zero-refresh updates.

---

## 📂 Project Structure
- `src/components/`: Core UI components (Navbar, LoanForm, LoanList)
- `src/pages/`: Main application views (Dashboard, AdminPanel, Login, Register)
- `src/firebase.js`: Centralized configuration.
- `src/index.css`: The "Premium" design system using Tailwind v4.

---

## 🎨 Premium Aesthetics
This system uses:
- **Glassmorphism Effects**: Transparent, blurred navigation bars and cards.
- **Elegant Typography**: Plus Jakarta Sans (UI) & Outfit (Headings).
- **Responsive Shell**: Works seamlessly from mobile phones to ultra-wide monitors.
- **Smooth Interaction**: Micro-animations via Framer Motion & Tailwind transitions.
