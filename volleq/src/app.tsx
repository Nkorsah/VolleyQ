import type { JSX } from "react";
import Navbar from "./components/Navbar";
import { useAuth } from './contexts/authContext/index.tsx';
import { doSignOut } from './firebase/auth.ts';
import { useNavigate } from "react-router-dom";
import { useUserStore } from "./store/user.ts";
import { serverTimestamp, Timestamp } from "firebase/firestore";
import { fetchUser } from "./api/api.ts";
import { useEffect } from "react";
import { useLoadUser } from "./hooks/useLoadUser.tsx";

function App(): JSX.Element {
  // const { currentUser, userLoggedIn, loading} = useAuth();
  // I should pull the user here too. 

  // refresh the user state by fetching user and storing it in userstore
  // useUserStore.setUser()
  
  // const currentUser = useUserStore((state) => state.setUser); // grabbing the state of user. 
  
  // const userdata = await fetchUser()

  // currentUser(userdata)
  const navigate = useNavigate();

  const loadUser = useLoadUser(); // this hook updates the user
  // use variable load user to pause the page if things are not loading. 
  // const setUser = useUserStore((state) => state.setUser);
  const user = useUserStore((state) => state.user);
  console.log("User loaded second time:", JSON.stringify(user, null, 2));

  // useEffect(() => {
  //   const loadUser = async () => {
  //     try {
  //       const userdata = await fetchUser();
  //       setUser(userdata);
  //       console.log("User loaded:", JSON.stringify(userdata, null, 2));
  //     } catch (err) {
  //       console.error("Failed to fetch user:", err);
  //     }
  //   };

  //   loadUser();
  // }, [setUser]);


  // console.log("user is:" + user)

  const handleLogout = async () => {
    try {
      await doSignOut();
      console.log("User logged out successfully");
      navigate("/"); // go to login
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#e6d6a6]">
      <Navbar user={user} onLogout={handleLogout} />

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center">
        <h1 className="text-5xl mb-10">
          Welcome back {user?.name || "Player"}!
        </h1>

        <button
          onClick={() =>{
            console.log(Timestamp.now());
            navigate("/map-page")
          }
           }
          className="text-2xl px-12 py-5 rounded-2xl border-2 border-black bg-[#f2e28d] hover:scale-105 transition-transform"
        >
          Find a Game
        </button>
      </main>
    </div>
  );
}

export default App;