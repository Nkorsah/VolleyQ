import { useState, type JSX } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from '../contexts/authContext/index.tsx';
import { doSignInWithEmailAndPassword , doSignInWithGoogle } from '../firebase/auth.ts';



function Login(): JSX.Element {
    
    const {userLoggedIn} = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');


    const [userCredentials, setUserCredentials] = useState({
    email: "",
    password: "",
  });

   const handleOnChange = (e) => {
    const fieldName = e.target.name;
    const fieldValue = e.target.value;
    setUserCredentials((prev) => ({ ...prev, [fieldName]: fieldValue }));
  };

    const onSubmit = async (e) => {
        e.preventDefault()
        if(!isSigningIn){
            setIsSigningIn(true)
            await doSignInWithEmailAndPassword(email, password)
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
    

  return (
   
    <div className="h-screen flex flex-col bg-[#e6d6a6]"> 
    {userLoggedIn && (<Navigate to={'/home'} replace={true}/>)}
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
          value={userCredentials.email}
          onChange={handleOnChange}
        />
        <input
          required
          type="password"
          name="password"
          placeholder="Password"
          value={userCredentials.password}
          onChange={handleOnChange}
        />
      </form>
        <h1 className="text-5xl mb-10">This is the login Screen</h1>
      </main>
    </div>
  );
}

export default Login;