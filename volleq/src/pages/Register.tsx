import { useState, type JSX } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext/index.tsx";
import { doCreateUserWithEmailAndPassword } from "../firebase/auth.ts";
import { serverTimestamp } from "firebase/firestore";
import { createUser, CreateUserRequest } from "./api.ts";

function Register(): JSX.Element {
  const navigate = useNavigate();
  const { userLoggedIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setErrorMessage("Passwords do not match");
    }

    if (!isSigningUp) {
      try {
        setIsSigningUp(true);
        setIsLoading(true);
        setErrorMessage("");

        const result = await doCreateUserWithEmailAndPassword(email, password);
        const firebaseUser = result.user;

        const newUser: CreateUserRequest = {
          name: name || firebaseUser.displayName || "Anonymous Player",
          avatarUrl: "https://i.pravatar.cc/50",
          role: "player",
          stats: { wins: 0, losses: 0 },
          createdAt: serverTimestamp()
        };

        await createUser(newUser);
        navigate("/home");
      } catch (error: any) {
        setErrorMessage(error.message || "Registration failed");
        setIsSigningUp(false);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (userLoggedIn) {
    return <Navigate to="/home" replace={true} />;
  }

  return (
    <div className="h-screen flex flex-col bg-[#FDF0B4] font-sans">
      {/* Navbar Matching Mockup */}
      <header className="flex justify-between items-center px-12 py-8 bg-[#FDF0B4]">
        <div className="text-3xl font-bold text-black">Logo</div>
        <div className="flex items-center gap-12">
          <a href="#" className="text-2xl font-bold text-black">Home</a>
          <a href="#" className="text-2xl font-bold text-black">About</a>
          <a href="#" className="text-2xl font-bold text-black">Contact</a>
          <button 
            onClick={() => navigate("/")}
            className="text-2xl font-bold border-2 border-black px-6 py-2 rounded-xl hover:bg-black/5"
          >
            Login
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center">
        <div className="bg-[#FFF49C] w-[500px] py-16 px-12 rounded-[40px] border border-black/20 shadow-sm flex flex-col items-center">
          <h2 className="text-4xl font-medium text-black mb-12">Create Account</h2>
          
          <form onSubmit={onSubmit} className="w-full flex flex-col gap-10">
            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <label className="text-lg text-black font-medium">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent border-b-2 border-black outline-none pb-1 text-lg"
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <label className="text-lg text-black font-medium">Password</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent border-b-2 border-black outline-none pb-1 text-lg"
              />
            </div>

            {/* Confirm Password Field */}
            <div className="flex flex-col gap-2">
              <label className="text-lg text-black font-medium">Confirm Password</label>
              <input
                required
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-transparent border-b-2 border-black outline-none pb-1 text-lg"
              />
            </div>

            {errorMessage && (
              <p className="text-red-600 text-center font-medium -mt-4">{errorMessage}</p>
            )}

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 bg-[#FFF49C] border-2 border-black py-4 rounded-2xl text-2xl font-bold hover:bg-black/5 transition-colors"
            >
              {isLoading ? "Signing Up..." : "Sign Up"}
            </button>
          </form>

          <p className="mt-8 text-lg">
            Already have an account?{" "}
            <span
              className="cursor-pointer font-bold hover:underline"
              onClick={() => navigate("/")}
            >
              Login
            </span>
          </p>
        </div>
      </main>
    </div>
  );
}

export default Register;