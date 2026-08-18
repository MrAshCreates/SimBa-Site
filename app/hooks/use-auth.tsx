import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { z } from "zod";
import type { User } from "~/data/auth";

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const storedUserSchema = z.object({
  id: z.string().min(1).max(128),
  username: z.string().min(1).max(64),
  email: z.string().email().max(254),
  phone: z.string().max(32).optional(),
  developerStatus: z.string().max(200).optional(),
  simbaUsage: z.string().max(200).optional(),
  createdAt: z.coerce.date(),
  isOwner: z.boolean().optional(),
});

function parseUser(value: unknown): User | null {
  const result = storedUserSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/me")
      .then(async (response) => {
        if (!response.ok) {
          return { user: null };
        }
        return (await response.json()) as { user?: unknown };
      })
      .then((data) => {
        if (!cancelled) {
          setUser(parseUser(data.user) ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = (nextUser: User) => {
    const parsed = parseUser(nextUser);
    if (parsed) {
      setUser(parsed);
    }
  };

  const logout = useCallback(async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {
      // Still clear the client session if the network call fails.
    }
    setUser(null);
  }, []);

  const isAuthenticated = user !== null;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isLoading }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
