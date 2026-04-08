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

interface StoredSession {
  email: string;
  name: string;
  picture: string;
  token: string;
  expiresAt: number; // ms epoch
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

const SESSION_KEY = "google_session";

function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: StoredSession = JSON.parse(raw);
    if (Date.now() >= session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const session = loadSession();
    if (session) {
      setUser({ email: session.email, name: session.name, picture: session.picture });
      setToken(session.token);
      setExpiresAt(session.expiresAt);
    }
  }, []);

  // Schedule logout at the exact moment the token expires
  useEffect(() => {
    if (!expiresAt) return;

    const msUntilExpiry = expiresAt - Date.now();
    if (msUntilExpiry <= 0) {
      setUser(null);
      setToken(null);
      setExpiresAt(null);
      localStorage.removeItem(SESSION_KEY);
      return;
    }

    const timeout = setTimeout(() => {
      setUser(null);
      setToken(null);
      setExpiresAt(null);
      localStorage.removeItem(SESSION_KEY);
    }, msUntilExpiry);

    return () => clearTimeout(timeout);
  }, [expiresAt]);

  const signIn = useCallback(
    (email: string, name: string, picture: string, accessToken: string, expiresIn: number) => {
      const exp = Date.now() + expiresIn * 1000;
      const session: StoredSession = { email, name, picture, token: accessToken, expiresAt: exp };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
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
    localStorage.removeItem(SESSION_KEY);
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
