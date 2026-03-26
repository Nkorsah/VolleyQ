// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from "./app.tsx";
import Login from "./pages/Login.tsx";
import MapPage from "./pages/MapPage.tsx";
import Register from "./pages/Register.tsx";
import Profile from "./pages/Profile.tsx";
import Settings from "./pages/Settings.tsx";

import { AuthProvider } from "./contexts/authContext/index.js";
import "./index.css";

// Define all routes
const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/home", element: <App /> },
  { path: "/map-page", element: <MapPage /> },
  { path: "/profile", element: <Profile /> },
  { path: "/settings", element: <Settings /> },
  { path: "*", element: <div className="p-10 text-center text-2xl">404 – Page Not Found</div> },
]);

// Mount React app
ReactDOM.createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  </AuthProvider>
);