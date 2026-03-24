import { useState, type JSX } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useMergedUser } from "../hooks/useMergedUser";
import { doSignInWithEmailAndPassword } from "../firebase/auth.ts";

function Login(): JSX.Element {
  const navigate = useNavigate();
  const { user, loading } = useMergedUser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    try {
      setIsLoading(true);
      setErrorMessage("");

      await doSignInWithEmailAndPassword(email, password);
      // No need to manually merge — useMergedUser will update automatically
      navigate("/home");
    } catch (error: any) {
      console.error("Login error:", error);
      setErrorMessage(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) return <p>Loading...</p>; // wait until auth state is known
  if (user) return <Navigate to="/home" replace />; // redirect if already logged in

  return (
    <div className="h-screen flex flex-col bg-[#e6d6a6]">
      <header className="flex justify-between items-center px-10 py-5">
        <div className="text-2xl font-bold">Logo</div>
        <div className="flex items-center gap-8">
          <a href="#" className="font-semibold">Home</a>
          <a href="#" className="font-semibold">Profile</a>
          <a href="#" className="font-semibold">Settings</a>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center">
        <form onSubmit={onSubmit} className="form">
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            required
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="navigate-text">
            Don't have an account?{" "}
            <span
              className="cursor-pointer text-blue-600"
              onClick={() => navigate("/register")}
            >
              Register
            </span>
          </p>
          {errorMessage && <p className="error-text text-red-500">{errorMessage}</p>}
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Loading..." : "Sign In"}
          </button>
        </form>

        <h1 className="text-5xl mb-10">This is the Login Screen</h1>
      </main>
    </div>
  );
}

export default Login;