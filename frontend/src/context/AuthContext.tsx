import { createContext, useContext, useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Load user safely on app start
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");

      if (
        storedUser &&
        storedUser !== "undefined" &&
        storedToken
      ) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
      }
    } catch (error) {
      console.error("Failed to load auth data:", error);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Login function
  const login = (userData: User, tokenValue: string) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", tokenValue);

    setUser(userData);
    setToken(tokenValue);
  };

  // ✅ Logout function
  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
