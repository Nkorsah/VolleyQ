import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase-service";
import { AppUser } from "../types/AppUser";

export const useMergedUser = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        // convert this into an api call to the backend. 
        // Fetch extra data from Firestore
        const docRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const extraData = docSnap.data();
          setUser({ ...firebaseUser, ...extraData } as AppUser);
        } else {
          // If no extra data yet, just use auth user
          setUser(firebaseUser as AppUser);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUser(firebaseUser as AppUser);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  return { user, loading };
};