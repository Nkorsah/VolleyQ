import { useEffect, useState } from "react";
import { fetchUser } from "../api/api";
import { useUserStore } from "../store/user";

export const useLoadUser = () => {
  const setUser = useUserStore((state) => state.setUser);
  const user = useUserStore((state) => state.user);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) return;

    const loadUser = async () => {
      try {
        setLoading(true);
        const userdata = await fetchUser();
        setUser(userdata);
        console.log("User loaded:", JSON.stringify(userdata, null, 2));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [user, setUser]);

  return { loading };
};