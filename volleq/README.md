# 🏐 VolleyQ

## 📁 Project Structure Overview

VolleyQ/
├── components/
├── public/
├── src/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json

---

## 🔧 Root Files

### `index.html`
- The main HTML entry point for the app.
- Contains the root `<div>` where the React app is mounted.

### `package.json`
- Defines project dependencies, scripts, and metadata.
- Includes libraries like React, Firebase, and Tailwind.

### `vite.config.ts`
- Configuration for Vite (build tool).
- Handles dev server, bundling, and plugins (e.g., React plugin).

### `tailwind.config.ts`
- TailwindCSS configuration.
- Controls theme customization, colors, and utility classes.

### `tsconfig.json`
- TypeScript configuration file.
- Defines compiler options and project structure rules.

### `postcss.config.js`
- Configures PostCSS (used with Tailwind for styling).

---

## 🧩 Components

### `components/Navbar.tsx`
- Reusable navigation bar component.
- Likely used across multiple pages for routing (Home, Login, Register, etc.).

---

## 🌐 Public Assets

### `public/vite.svg`
- Static asset used by the app (default Vite logo).

---

## ⚛️ Source Code (`src/`)

This is the core of the application.

---

### 🚀 App Entry

#### `main.tsx`
- The main entry point for React.
- Renders `<App />` into the DOM.
- Wraps the app with providers (e.g., authentication context).

#### `App.tsx`
- Root React component.
- Defines overall layout and routing between pages.

#### `index.css`
- Global styles.
- Includes Tailwind base, components, and utilities.

---

### 📄 Pages (`src/pages/`)

Each file represents a screen in the app.

#### `home.tsx`
- Landing page after login.
- Likely shows main features (games, locations, etc.).

#### `Login.tsx`
- Current login page.
- Handles user authentication.

#### `Register.tsx`
- User registration page.
- Allows new users to create accounts.

#### `oldlogin.tsx` / `oldLogin2.tsx`
- Deprecated login implementations.
- Kept for reference or fallback.

---

### 🔐 Authentication & Context

#### `contexts/authContext`
- Provides global authentication state.
- Makes user data accessible throughout the app.

---

### 🔥 Firebase Integration (`src/firebase/`)

Handles backend services.

#### `firebase.ts`
- Initializes Firebase app with config.

#### `auth.ts`
- Handles authentication logic (login, logout, signup).

#### `firebase-service.ts`
- Abstraction layer for interacting with Firebase services (Firestore, etc.).

---

### 🧠 AI / Gemini Integration

#### `gemini/page.ts`
- Page or feature integrating Google Gemini AI.
- Likely used for smart suggestions, chat, or insights.

---

### 📍 Geolocation

#### `geocoding/index.ts`
- Handles location-based functionality.
- Converts addresses ↔ coordinates (used for finding courts or players nearby).

---

### 🪝 Custom Hooks

#### `hooks/useMergedUser.tsx`
- Custom React hook.
- Combines Firebase auth user with additional app-specific user data.

---

### 🧮 Utilities

#### `counter.ts`
- Example/demo utility (likely from Vite template).
- Not core to app functionality.

---

### 🧾 Types

#### `types/AppUser.ts`
- TypeScript type definitions for user data.
- Ensures consistent structure across the app.

---

### 🖼 Assets

#### `typescript.svg`
- Static image asset.

---

## ⚙️ Features Summary

- 🔐 User authentication (Firebase)  
- 📍 Location-based features (geocoding)  
- 🧠 AI integration (Gemini)  
- ⚛️ Component-based UI (React)  
- 🎨 Modern styling (TailwindCSS)  

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build