import { useState, useEffect, type JSX } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from '../contexts/authContext/index.tsx';
import { doSignInWithEmailAndPassword , doSignInWithGoogle } from '../firebase/auth.ts';
import { useNavigate } from "react-router-dom";

function Login(): JSX.Element {

  const navigate = useNavigate();


  const {userLoggedIn} = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  // const [error, setError] = useState("");


  //  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const fieldName = e.target.name;
  //   const fieldValue = e.target.value;
  //   setUserCredentials((prev) => ({ ...prev, [fieldName]: fieldValue }));
  // };

  useEffect(() => {
    console.log("[AUTH] userLoggedIn:", userLoggedIn);
  }, [userLoggedIn]);

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault() // to prevent refreshing
        console.log('button has been pressed!')

         console.log("[LOGIN] Submit clicked");
    console.log("[LOGIN] Email:", email);
    console.log("[LOGIN] Password:", password);

   
        if(!isSigningIn){
            try {
            setIsSigningIn(true);

            console.log("[LOGIN] Calling Firebase...");

            const result = await doSignInWithEmailAndPassword(email, password);

            console.log("[LOGIN] Success:", result);

          } catch (error) {
            console.error("[LOGIN] Error:", error);
            setErrorMessage("Login failed");
            setIsSigningIn(false);
          }
        };
    }
    // const onGoogleSignIn = (e) => {
    //   e.preventDefault()
    //   if(!isSigningIn){
    //     setIsSigningIn(true)
    //     doSignInWithGoogle().catch(err => {
    //             setIsSigningIn(false)
    //         })
    //     }
    //   }
    

  // 🔁 Redirect if already logged in
  if (userLoggedIn) {
    console.log("[LOGIN] Redirecting to /home");
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
              onClick={() => navigate("/register")}
            >
              Register
            </span>
          </p>

          {errorMessage && (
            <p className="error-text text-red-500">{errorMessage}</p>
          )}

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Loading..." : "Sign In"}
          </button>
        </form>

        <h1 className="text-5xl mb-10">This is the login Screen</h1>
      </main>
    </div>
  );
}

export default Login;