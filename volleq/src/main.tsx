// main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app.tsx";
import Login from "./pages/Login.tsx";
import MapPage from "./pages/MapPage.tsx";
import Register from "./pages/Register.tsx";
import Home from "./pages/home.tsx";
import EditProfile from "./pages/EditProfile.tsx"; // 1. Import it here
import "./index.css";
import { AuthProvider } from "./contexts/authContext/index.tsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  { path: "/home", element: <Home /> }, // App currently acts as your Home
  { path: "/register", element: <Register /> },
  { path: "/map-page", element: <MapPage /> },
  { path: "/edit-profile", element: <EditProfile /> } // 2. Add this line
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);