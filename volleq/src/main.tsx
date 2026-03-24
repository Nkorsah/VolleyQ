import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app.tsx";
import Login from "./pages/Login.tsx";
import MapPage from "./pages/MapPage.tsx";
import "./index.css";
import { AuthProvider } from "./contexts/authContext/index.js";
import Register from "./pages/Register.tsx";

import{createBrowserRouter, RouterProvider} from "react-router-dom";

const router = createBrowserRouter([
  {path:"/", element:<Login/>},
  {path:"/home", element:<App/>},
  {path:"/register", element:<Register/>},
  {path:"/map-page", element:<MapPage/>}
])

ReactDOM.createRoot(document.getElementById("root")!).render(
  <AuthProvider>
     <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
  </AuthProvider>
 
)