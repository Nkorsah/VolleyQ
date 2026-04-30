// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app.tsx";
import Login from "./pages/Login.tsx";
import MapPage from "./pages/MapPage.tsx";
import Register from "./pages/Register.tsx";
import Profile from "./pages/Profile.tsx";
import Settings from "./pages/Settings.tsx";
import "./index.css";
import { AuthProvider } from "./contexts/authContext/index.js";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { Router } from "react-router-dom";
import { createBrowserRouter } from "react-router-dom";
import VenueDetailsView from "./pages/VenueDetailsView.tsx";
// import MapPage from "./pages/MapPage.tsx";


// Define all routes
const router = createBrowserRouter([
  {path:"/", element:<Login/>},
  {path:"/home", element:<App/>},
  {path:"/register", element:<Register/>},
  {path:"/map", element:<MapPage/>},
  {path:"/profile", element:<Profile/>},
  {path:"/settings", element:<Settings/>},
  {path:"/Venue/:venue_name/:venueID", element:<VenueDetailsView/>}
])

ReactDOM.createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  </AuthProvider>
);