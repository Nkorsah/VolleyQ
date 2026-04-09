import { useState, type JSX } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useMergedUser } from "../hooks/useMergedUser";
import { doSignInWithEmailAndPassword } from "../firebase/auth"; // Removed .ts extension for better resolution compatibility
// import { useAuth } from "../contexts/authContext/index.tsx";
import { auth } from "../firebase/firebase-service";
import { fetchUser } from "../api/api";
import { useUserStore } from "../store/user";

function Login(): JSX.Element {
  const navigate = useNavigate();
  // const {currentUser} = useAuth();
  const { user, loading, } = useMergedUser();

  const setJustRegistered = useUserStore((s) => s.setJustRegistered);
  const justRegistered = useUserStore((s) => s.justRegistered);

  console.log(`Just registered status: ${justRegistered}`)

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // const userState = useUserStore();
  const setUser = useUserStore((state) => state.setUser);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    try {
      setIsLoading(true);
      setErrorMessage("");

      await doSignInWithEmailAndPassword(email, password);
      // ok make an api call to auth. Get User

      //error handle this
      const token = await auth.currentUser?.getIdToken(true);

      console.log("ID Token:", token);

      try {
        const userData = await fetchUser();
        setUser(userData);
        navigate("/home");
      } catch (err) {
        console.error("Profile fetch failed:", err);
      }
      // save jwt in state?
      setJustRegistered(false)
      // useMergedUser hook will handle the state update automatically
      // navigate("/home"); changed so navigation happens when userdata is fetched
    } catch (error: any) {
      console.error("Login error:", error);
      setErrorMessage(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-[#FDF0B4]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xl font-bold">Loading...</p>
        </div>
      </div>
    );

  if (user && !justRegistered) return <Navigate to="/home" replace />;

  return (
    <div className="h-screen flex flex-col bg-[#FDF0B4] font-sans overflow-hidden">
      {/* Navigation Header */}
      <header className="flex justify-between items-center px-12 py-8 bg-[#FDF0B4]">
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
            className="text-2xl font-bold border-2 border-black px-6 py-2 rounded-xl bg-white/20 transition-all cursor-default"
            disabled
          >
            Login
          </button>
        </nav>
      </header>

      {/* Login Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-[#FFF49C] w-full max-w-[500px] py-16 px-12 rounded-[40px] border border-black/10 shadow-lg flex flex-col items-center">
          <h2 className="text-5xl font-medium text-black mb-16">Login</h2>

          <form onSubmit={onSubmit} className="w-full flex flex-col gap-10">
            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <label className="text-lg text-black font-medium">Email</label>
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent border-b-2 border-black outline-none pb-1 text-lg focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <label className="text-lg text-black font-medium">Password</label>
              <input
                required
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent border-b-2 border-black outline-none pb-1 text-lg focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex justify-between items-center text-md font-medium">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-black border-2 border-black"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="group-hover:opacity-70 transition-opacity">
                  Remember me
                </span>
              </label>
              <span className="cursor-pointer hover:underline text-black/80">
                Forgot Password?
              </span>
            </div>

            {errorMessage && (
              <p className="text-red-600 text-center font-bold text-sm bg-red-50 p-2 rounded-lg border border-red-100">
                {errorMessage}
              </p>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 bg-[#FFF49C] border-2 border-black py-4 rounded-2xl text-2xl font-bold hover:bg-black/5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing In..." : "Login"}
            </button>
          </form>

          <footer className="mt-8 text-lg font-medium text-black/90">
            Don't have an account?{" "}
            <span
              className="cursor-pointer font-bold hover:underline"
              onClick={() => navigate("/register")}
            >
              Register
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default Login;
