import { useEffect, useState } from "react";
import { fetchUser } from "../api/api";
import { useUserStore } from "../store/user";

export const useLoadUser = () => {
  const setUser = useUserStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);

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

  // Optional: load on mount
  useEffect(() => {
    loadUser();
  }, []);

  return { loading, loadUser };
};