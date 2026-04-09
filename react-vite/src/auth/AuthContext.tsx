import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

interface AuthUser {
  email: string;
  name: string;
  picture: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  signIn: (email: string, name: string, picture: string, accessToken: string, expiresIn: number) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  signIn: () => {},
  signOut: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);

  // Schedule logout at the exact moment the token expires
  useEffect(() => {
    if (!expiresAt) return;

    const msUntilExpiry = expiresAt - Date.now();
    if (msUntilExpiry <= 0) {
      setUser(null);
      setToken(null);
      setExpiresAt(null);
      return;
    }

    const timeout = setTimeout(() => {
      setUser(null);
      setToken(null);
      setExpiresAt(null);
    }, msUntilExpiry);

    return () => clearTimeout(timeout);
  }, [expiresAt]);

  const signIn = useCallback(
    (email: string, name: string, picture: string, accessToken: string, expiresIn: number) => {
      const exp = Date.now() + expiresIn * 1000;
      setUser({ email, name, picture });
      setToken(accessToken);
      setExpiresAt(exp);
    },
    []
  );

  const signOut = useCallback(() => {
    setUser(null);
    setToken(null);
    setExpiresAt(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token && !!expiresAt && Date.now() < expiresAt,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
