"use client";

import { env } from "@/env";
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
  resetAuthState: () => null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();
  const utils = api.useUtils();
  const [authLoading, setAuthLoading] = useState(true);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<RoleSelectWithRelations | null>(
    null,
  );
  const setActiveRoleMutation = api.user.setActiveRole.useMutation();

  const { data: roles = [], isLoading: isWorkspaceLoading } =
    api.user.getRoles.useQuery(undefined, {
      enabled: !!authUser,
    });

  const refreshAuthUser = async () => {
    const { data } = await supabase.auth.getUser();
    setAuthUser(data?.user ?? null);
    setAuthLoading(false);
  };

  useEffect(() => {
    void refreshAuthUser();

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
      console.log("Unsubscribing from auth state change");
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authUser && roles.length > 0) {
      const initializeAuth = async () => {
        const activeRoleMetadata: ActiveRole | undefined =
          authUser.app_metadata?.activeRole;
        const activeWorkspaceRole = activeRoleMetadata
          ? roles.find((role) => role.id === activeRoleMetadata.id)
          : null;

        if (activeWorkspaceRole) {
          setActiveRole(activeWorkspaceRole);
        } else {
          // If no active role is set or it's invalid, use the first role
          const firstRole = roles[0];
          if (firstRole) {
            await handleWorkspaceSwitch(firstRole);
          }
        }
      };
      void initializeAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles, authUser]);

  const handleWorkspaceSwitch = async (role: RoleSelectWithRelations) => {
    setActiveRole(role);
    if (role?.workspaceId) {
      await setActiveRoleMutation.mutateAsync({
        workspaceId: role.workspaceId,
        roleId: role.id,
      });

      await refreshAuthUser();

      // Invaliate all routes when workspace changes
      // This is just a safe way to ensure we refetch everything
      await utils.invalidate();
    }
  };

  const login = async () => {
    if (env.NEXT_PUBLIC_PLATFORM === "desktop") {
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
    setAuthUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        authUser,
        authLoading,
        user: activeRole?.user ?? null,
        roles,
        activeRole,
        setActiveRole,
        handleWorkspaceSwitch,
        isWorkspaceLoading,
        login,
        logout,
        resetAuthState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
