"use client";

import { useToast } from "@/hooks/use-toast";
import { PATH_LOGIN } from "@/lib/paths";
import { createClient } from "@/lib/supabase/client";
import {
  loginWithProvider,
  loginWithProviderElectron,
} from "@/server/auth/actions";
import {
  type ROLE_VALUES,
  type RoleSelectWithRelations,
  type UserSelect,
} from "@/server/db/schema";
import { api } from "@/trpc/react";
import { type User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";

export type ActiveRole = {
  id: string;
  workspaceId: string;
  roleType: (typeof ROLE_VALUES)[number];
};

type AuthContextType = {
  authLoading: boolean;
  authUser: User | null;
  user: UserSelect | null;
  roles: RoleSelectWithRelations[];
  activeRole: RoleSelectWithRelations | null;
  isWorkspaceLoading: boolean;
  setActiveRole: React.Dispatch<
    React.SetStateAction<RoleSelectWithRelations | null>
  >;
  handleWorkspaceSwitch: (role: RoleSelectWithRelations) => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  authError: string | null;
  setAuthError: React.Dispatch<React.SetStateAction<string | null>>;
  resetAuthState: () => void;
};

export const AuthContext = createContext<AuthContextType>({
  authLoading: true,
  authUser: null,
  user: null,
  roles: [],
  activeRole: null,
  isWorkspaceLoading: true,
  setActiveRole: () => null,
  handleWorkspaceSwitch: () => Promise.resolve(),
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  authError: null,
  setAuthError: () => null,
  resetAuthState: () => null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserSelect | null>(null);
  const [activeRole, setActiveRole] = useState<RoleSelectWithRelations | null>(
    null,
  );
  const setActiveRoleMutation = api.user.setActiveRole.useMutation();
  const [isElectron, setIsElectron] = useState(false);

  const { data: roles = [], isLoading: isWorkspaceLoading } =
    api.user.getRoles.useQuery(undefined, {
      enabled: !!authUser,
    });

  useEffect(() => {
    // Initial check
    const isElectronAvailable =
      typeof window !== "undefined" && window.electron !== undefined;
    setIsElectron(isElectronAvailable);

    // Only start polling if electron is not already available
    if (!isElectronAvailable) {
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (typeof window !== "undefined" && window.electron !== undefined) {
          setIsElectron(true);
          clearInterval(checkInterval);
        } else if (Date.now() - startTime > 2000) {
          // 2 second timeout
          clearInterval(checkInterval);
        }
      }, 100);

      return () => clearInterval(checkInterval);
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async (rolesList: RoleSelectWithRelations[]) => {
      const activeRoleMetadata = authUser?.app_metadata?.activeRole;
      const activeWorkspaceRole = activeRoleMetadata
        ? rolesList.find((role) => role.id === activeRoleMetadata.id)
        : null;

      if (activeWorkspaceRole) {
        setActiveRole(activeWorkspaceRole);
        setUser(activeWorkspaceRole.user ?? null);
      } else {
        // If no active role is set or it's invalid, use the first role
        const firstRole = rolesList[0];
        if (firstRole) {
          await handleWorkspaceSwitch(firstRole);
        }
        setUser(rolesList[0]?.user ?? null);
      }
    };
    if (roles.length > 0) {
      void initializeAuth(roles);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles]);

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

  const handleWorkspaceSwitch = async (role: RoleSelectWithRelations) => {
    setActiveRole(role);
    if (role?.workspaceId) {
      await setActiveRoleMutation.mutateAsync({
        workspaceId: role.workspaceId,
        roleId: role.id,
      });
    }
  };

  const fetchAuthUser = async () => {
    const { data } = await supabase.auth.getUser();
    setAuthUser(data?.user ?? null);
  };

  const login = async () => {
    if (isElectron) {
      const result = await loginWithProviderElectron({
        provider: "google",
      });
      if (!result.url) {
        toast({
          title: "Error",
          description: result.error ?? "Failed to authenticate with service",
          variant: "destructive",
        });
      } else {
        window.electron.send("open-external", result.url);
      }
    } else {
      await loginWithProvider({ provider: "google" });
    }
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
        handleWorkspaceSwitch,
        isWorkspaceLoading,
        authError,
        login,
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
