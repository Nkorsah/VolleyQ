import { useState, useEffect, type JSX } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext/index.tsx";
import { doCreateUserWithEmailAndPassword } from "../firebase/auth.ts";
import { db } from "../firebase/firebase-service";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import axios from "axios";
import { createUser } from "./api.ts";

function Register(): JSX.Element {
  const navigate = useNavigate();
  const { userLoggedIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState("");

  const [responseMessage, setResponseMessage] = useState("");

  // 🔍 Debug auth state
  useEffect(() => {
    console.log("[AUTH] userLoggedIn:", userLoggedIn);
  }, [userLoggedIn]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log("[REGISTER] Submit clicked");
    console.log("[REGISTER] Email:", email);
    console.log("[REGISTER] Password:", password);

    if (!isSigningUp) {
      try {
        console.log(name)
        setIsSigningUp(true);
        setIsLoading(true);
        setErrorMessage("");

        console.log("[REGISTER] Creating user in Firebase...");

        // authenticating the user to firebase
        const result = await doCreateUserWithEmailAndPassword(email, password);
        const firebaseUser = result.user; // getting the user after creation
        console.log(firebaseUser);

        // writing additional data about the user into the firestore database.
        // creating new user entity to be sent to the database. 
        const newUser = { // Need to give a unique ID. I can create a separate file for requests! 
          name: name || firebaseUser.displayName || "",
          avatarUrl: "https://i.pravatar.cc/50",
          role: "player",
          stats: { wins: 0, losses: 0 },
          createdAt: serverTimestamp()
        }

        try{ // 
          const data = await createUser(newUser);
          console.log("User created:", data);
        } catch (err) {
          console.error("Create user failed", err);
        }

        // try {
        //   // calls the backend. 
        //   const res = await axios.post(`${import.meta.env.VITE_SERVER_HOST}/api/user-create`, newUser);
        //   console.log('Status:', res.status);
        //   console.log('Response data:', res.data);
        //   console.log("[REGISTER] Firestore document created");
        // } catch (err) {
        //     if (axios.isAxiosError(err)) {
        //       // Now TypeScript knows err is AxiosError
        //       if (err.response) {
        //         console.error('POST failed with status:', err.response.status, err.response.statusText);
        //       } else if (err.request) {
        //         console.error('Network error: no response from server');
        //       } else {
        //         console.error('Request setup error:', err.message);
        //       }
        //     } else {
        //       // Non-Axios error
        //       console.error('Unexpected error', err);
        //     }

        //     // Remove the user from authenticated list. see if there is a delete user function from index.tsx firebase file
        // }
     
        // try {
        //   // api call instead
        //   await setDoc(doc(db, "users", firebaseUser.uid), {
        //     name: name || firebaseUser.displayName || "",
        //     avatarUrl: "https://i.pravatar.cc/50",
        //     createdAt: serverTimestamp(),
        //     role: "player",
        //     stats: { wins: 0, losses: 0 },
        //   });
        //   console.log("[REGISTER] Firestore document created");
        // } catch (error) {
        //   console.error("[REGISTER] Firestore error:", error);
        //   
        // }
        
       

        // Redirect after successful signup
        navigate("/home");
      } catch (error: any) {
        console.error("[REGISTER] Error:", error);
        setErrorMessage(error.message || "Registration failed");
        setIsSigningUp(false);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 🔁 Redirect if already logged in
  if (userLoggedIn) {
    console.log("[REGISTER] Redirecting to /home");
    return <Navigate to="/home" replace={true} />;
  }

  return (
    <div className="h-screen flex flex-col bg-[#e6d6a6]">
      {/* Navbar */}
      <header className="flex justify-between items-center px-10 py-5">
        <div className="text-2xl font-bold">Logo</div>

        <div className="flex items-center gap-8">
          <a href="#" className="font-semibold">Home</a>
          <a href="#" className="font-semibold">Profile</a>
          <a href="#" className="font-semibold">Settings</a>

          <button className="border border-black px-4 py-2 rounded-lg">
            Logout
          </button>

          <img
            className="w-9 h-9 rounded-full"
            src="https://i.pravatar.cc/40"
            alt="avatar"
          />
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center">
        <form onSubmit={onSubmit} className="form">
          <input
            required
            type="text"
            name="name"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            required
            type="email"
            name="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              console.log("[INPUT] Email:", e.target.value);
              setEmail(e.target.value);
            }}
          />

          <input
            required
            type="password"
            name="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              console.log("[INPUT] Password:", e.target.value);
              setPassword(e.target.value);
            }}
          />

          <p className="navigate-text">
            Already have an account?{" "}
            <span
              className="cursor-pointer text-blue-600"
              onClick={() => navigate("/")}
            >
              Log In
            </span>
          </p>

          {errorMessage && (
            <p className="error-text text-red-500">{errorMessage}</p>
          )}

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Loading..." : "Sign Up"}
          </button>
        </form>

        <h1 className="text-5xl mb-10">This is the Register Screen</h1>
      </main>
    </div>
  );
}

export default Register;