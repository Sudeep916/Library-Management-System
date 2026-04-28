import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);
const STORAGE_KEY = "libraryAuth";

const readStoredAuth = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const storedAuth = readStoredAuth();

  const [token, setToken] = useState(storedAuth?.token || "");
  const [user, setUser] = useState(storedAuth?.user || null);
  const [loading, setLoading] = useState(Boolean(storedAuth?.token));

  const persistAuth = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        token: nextToken,
        user: nextUser
      })
    );
  };

  const clearAuth = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  useEffect(() => {
    const verifySession = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me");

        setUser(data.user);

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            token,
            user: data.user
          })
        );
      } catch {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, [token]);

  const login = async (credentials) => {
    const { data } = await api.post("/auth/login", credentials);
    persistAuth(data.token, data.user);
    return data.user;
  };

  const logout = () => {
    clearAuth();
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);