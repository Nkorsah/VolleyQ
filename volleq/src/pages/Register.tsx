import { useState, useEffect, type JSX } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext/index.tsx";
import { doCreateUserWithEmailAndPassword } from "../firebase/auth.ts";
// import { db } from "../firebase/firebase-service";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
// import axios from "axios";
import { createUser } from "../api/api.ts";
import { v4 as uuid } from "uuid";
import { useMergedUser } from "../hooks/useMergedUser.tsx";
import { useUserStore } from "../store/user.ts";

function Register(): JSX.Element {
  const navigate = useNavigate();
  const { userLoggedIn } = useAuth();
  const setJustRegistered = useUserStore((s) => s.setJustRegistered);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // redirect if already logged in
  if (userLoggedIn) {
    return <Navigate to="/home" replace={true} />;
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return setErrorMessage("Passwords do not match");
    }

    try {
      setIsSigningUp(true);
      setIsLoading(true);
      setErrorMessage("");

      // create user in firebase auth
      const result = await doCreateUserWithEmailAndPassword(email, password);
      const firebaseUser = result.user;

      // create user entity for firestore. just send the userid, name and email. Server will handle the rest
      const newUser = {
        userID: firebaseUser.uid, // better to use firebase UID than a random UUID
        name: name,
        email: email,
      };

      console.log(`user is ${JSON.stringify(newUser, null, 2 )}`)

      // save to DB via your API helper
      // takes in id, name, email. 
      await createUser(newUser); // update the fields of the request new user.

      const justRegistered = setJustRegistered(true)
      console.log(`${justRegistered}`)

      navigate("/");
    } catch (error: any) {
      console.error("[REGISTER] Error:", error);
      setErrorMessage(error.message || "Registration failed");
      setIsSigningUp(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#FDF0B4] font-sans overflow-hidden">
      {/* Navigation Header */}
      <header className="flex justify-between items-center px-12 py-8">
        <div className="text-3xl font-bold text-black tracking-tight cursor-default">
          Logo
        </div>
        <nav className="flex items-center gap-12">
          <a
            href="#"
            className="text-2xl font-bold text-black hover:opacity-70 transition-opacity"
          >
            Home
          </a>
          <a
            href="#"
            className="text-2xl font-bold text-black hover:opacity-70 transition-opacity"
          >
            About
          </a>
          <a
            href="#"
            className="text-2xl font-bold text-black hover:opacity-70 transition-opacity"
          >
            Contact
          </a>
          <button
            onClick={() => navigate("/")}
            className="text-2xl font-bold border-2 border-black px-6 py-2 rounded-xl bg-white/20 hover:bg-black hover:text-[#FDF0B4] transition-all"
          >
            Login
          </button>
        </nav>
      </header>

      {/* Register Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-[#FFF49C] w-full max-w-[550px] py-12 px-12 rounded-[40px] border border-black/10 shadow-lg flex flex-col items-center">
          <h2 className="text-5xl font-medium text-black mb-12">
            Create Account
          </h2>

          <form onSubmit={onSubmit} className="w-full flex flex-col gap-6">
            {/* Username Field */}
            <div className="flex flex-col gap-1">
              <label className="text-lg text-black font-medium">Username</label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-transparent border-b-2 border-black outline-none pb-1 text-lg focus:border-blue-500 transition-colors"
              />
            </div>
            {/* Email Field */}
            <div className="flex flex-col gap-1">
              <label className="text-lg text-black font-medium">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent border-b-2 border-black outline-none pb-1 text-lg focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1">
              <label className="text-lg text-black font-medium">Password</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent border-b-2 border-black outline-none pb-1 text-lg focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Confirm Password Field */}
            <div className="flex flex-col gap-1">
              <label className="text-lg text-black font-medium">
                Confirm Password
              </label>
              <input
                required
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-transparent border-b-2 border-black outline-none pb-1 text-lg focus:border-blue-500 transition-colors"
              />
            </div>

            {errorMessage && (
              <p className="text-red-600 text-center font-bold text-sm bg-red-50 p-2 rounded-lg border border-red-100">
                {errorMessage}
              </p>
            )}

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 bg-[#FFF49C] border-2 border-black py-4 rounded-2xl text-2xl font-bold hover:bg-black hover:text-[#FFF49C] transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <footer className="mt-8 text-lg font-medium text-black/90">
            Already have an account?{" "}
            <span
              className="cursor-pointer font-bold hover:underline"
              onClick={() => navigate("/")}
            >
              Login
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default Register;
