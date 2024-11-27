"use client";

import { PATH_LOGIN } from "@/lib/paths";
import { createClient } from "@/lib/supabase/client";
import {
  type RoleSelectWithRelations,
  type UserSelect,
} from "@/server/db/schema";
import { api } from "@/trpc/react";
import { type User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
  authLoading: boolean;
  authUser: User | null;
  user: UserSelect | null;
  roles: RoleSelectWithRelations[] | null;
  activeRole: RoleSelectWithRelations | null;
  isWorkspaceLoading: boolean;
  setActiveRole: React.Dispatch<
    React.SetStateAction<RoleSelectWithRelations | null>
  >;
  logout: () => Promise<void>;
  authError: string | null;
  setAuthError: React.Dispatch<React.SetStateAction<string | null>>;
  resetAuthState: () => void;
};

export const AuthContext = createContext<AuthContextType>({
  authLoading: true,
  authUser: null,
  user: null,
  roles: null,
  activeRole: null,
  isWorkspaceLoading: true,
  setActiveRole: () => null,
  logout: () => Promise.resolve(),
  authError: null,
  setAuthError: () => null,
  resetAuthState: () => null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = createClient();
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserSelect | null>(null);
  const [roles, setRoles] = useState<RoleSelectWithRelations[] | null>(null);
  const [activeRole, setActiveRole] = useState<RoleSelectWithRelations | null>(
    null,
  );

  const { data: rolesData, isLoading: isWorkspaceLoading } =
    api.user.getRoles.useQuery(undefined, {
      enabled: !!authUser,
    });

  useEffect(() => {
    if (rolesData && rolesData.length > 0) {
      setActiveRole(rolesData[0] ?? null);
      setRoles(rolesData);
      setUser(rolesData[0]?.user ?? null);
    }
  }, [rolesData]);

  useEffect(() => {
    const initializeAuth = async () => {
      await fetchAuthUser();
    };

    void initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      if (event === "SIGNED_IN") {
        if (!authUser && !authLoading) {
          setAuthUser(session?.user ?? null);
          setAuthLoading(false);
        }
      } else if (event === "SIGNED_OUT") {
        resetAuthState();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchAuthUser = async () => {
    const { data } = await supabase.auth.getUser();
    setAuthUser(data?.user ?? null);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push(PATH_LOGIN);
  };

  const resetAuthState = () => {
    setActiveRole(null);
    setUser(null);
    setAuthUser(null);
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        authUser,
        authLoading,
        user,
        roles,
        activeRole,
        setActiveRole,
        isWorkspaceLoading,
        authError,
        logout,
        setAuthError,
        resetAuthState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
