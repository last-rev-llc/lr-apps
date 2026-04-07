"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import {
  Auth0Provider as Auth0ProviderBase,
  useUser,
} from "@auth0/nextjs-auth0/client";
import type { User } from "@auth0/nextjs-auth0/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function AuthContextBridge({ children }: { children: ReactNode }) {
  const { user, isLoading } = useUser();

  const signOut = () => {
    const w = globalThis as unknown as Window;
    w.location.href = "/auth/logout";
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        loading: isLoading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({
  user,
  children,
}: {
  user?: User;
  children: ReactNode;
}) {
  return (
    <Auth0ProviderBase user={user}>
      <AuthContextBridge>{children}</AuthContextBridge>
    </Auth0ProviderBase>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
