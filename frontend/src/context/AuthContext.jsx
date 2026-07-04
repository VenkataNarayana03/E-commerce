import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(Boolean(localStorage.getItem("accessToken")));

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setIsLoading(false);
      return;
    }

    api
      .get("/auth/me")
      .then((response) => {
        localStorage.setItem("user", JSON.stringify(response.data));
        setUser(response.data);
      })
      .catch(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const saveSession = ({ access_token: accessToken, user: nextUser }) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("user", JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const login = async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    saveSession(response.data);
    return response.data.user;
  };

  const register = async (payload) => {
    const response = await api.post("/auth/register", payload);
    saveSession(response.data);
    return response.data.user;
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
