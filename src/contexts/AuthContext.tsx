"use client";

import { PATH_LOGIN } from "@/lib/paths";
import { createClient } from "@/lib/supabase/client";
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
  roles: RoleSelectWithRelations[] | null;
  activeRole: RoleSelectWithRelations | null;
  isWorkspaceLoading: boolean;
  setActiveRole: React.Dispatch<
    React.SetStateAction<RoleSelectWithRelations | null>
  >;
  handleWorkspaceSwitch: (role: RoleSelectWithRelations) => Promise<void>;
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
  handleWorkspaceSwitch: () => Promise.resolve(),
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
  const setActiveRoleMutation = api.user.setActiveRole.useMutation();

  const handleWorkspaceSwitch = async (role: RoleSelectWithRelations) => {
    setActiveRole(role);
    if (role?.workspaceId) {
      await setActiveRoleMutation.mutateAsync({
        workspaceId: role.workspaceId,
        roleId: role.id,
      });
    }
  };

  const { data: rolesData, isLoading: isWorkspaceLoading } =
    api.user.getRoles.useQuery(undefined, {
      enabled: !!authUser,
    });

  useEffect(() => {
    const initializeAuth = async (rolesList: RoleSelectWithRelations[]) => {
      const activeRoleMetadata = authUser?.app_metadata?.activeRole;
      const activeWorkspaceRole = activeRoleMetadata
        ? rolesList.find((role) => role.id === activeRoleMetadata.id)
        : null;

      if (activeWorkspaceRole) {
        setActiveRole(activeWorkspaceRole);
        setRoles(rolesList);
        setUser(activeWorkspaceRole.user ?? null);
      } else {
        // If no active role is set or it's invalid, use the first role
        const firstRole = rolesList[0];
        if (firstRole) {
          await handleWorkspaceSwitch(firstRole);
        }
        setRoles(rolesList);
        setUser(rolesList[0]?.user ?? null);
      }
    };
    if (rolesData && rolesData.length > 0) {
      void initializeAuth(rolesData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        handleWorkspaceSwitch,
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
