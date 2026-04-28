import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);
const STORAGE_KEY = "libraryAuth";

const readStoredAuth = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch (error) {
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
    let isMounted = true;

    const verifySession = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        if (isMounted) {
          persistAuth(token, data.user);
        }
      } catch (error) {
        if (isMounted) {
          clearAuth();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
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
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

