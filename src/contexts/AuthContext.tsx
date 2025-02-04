"use client";

import { env } from "@/env";
import { useToast } from "@/hooks/use-toast";
import {
  PATH_ELECTRON_CALLBACK,
  PATH_GOOGLE_INTEGRATION_OAUTH_CALLBACK,
  PATH_LOGIN,
} from "@/lib/paths";
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
  const { authUser, authLoading, refreshAuthUser, onboardingComplete } =
    useAuthUser();
  const [activeRole, setActiveRole] = useState<RoleSelectWithRelations | null>(
    null,
  );
  const setActiveRoleMutation = api.user.setActiveRole.useMutation({
    onSuccess: async () => {
      await refreshAuthUser();
    },
  });

  console.log("onboardingComplete", onboardingComplete);

  const { data: roles = [], isLoading: isWorkspaceLoading } =
    api.user.getRoles.useQuery(undefined, {
      enabled: !!authUser && onboardingComplete,
    });

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
    if (role?.workspaceId) {
      await setActiveRoleMutation.mutateAsync({
        workspaceId: role.workspaceId,
        roleId: role.id,
      });

      // TODO: This should just call initialiseAuth or something like it
      setActiveRole(role);

      // Invaliate all routes when workspace changes
      // This is just a safe way to ensure we refetch everything
      await utils.invalidate();
    }
  };

  const login = async () => {
    if (env.NEXT_PUBLIC_PLATFORM === "desktop") {
      try {
        const { error, data } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}${PATH_ELECTRON_CALLBACK}`,
            skipBrowserRedirect: true,
          },
        });

        if (error || !data.url) {
          toast({
            title: "Error",
            description:
              error?.message ?? "Failed to authenticate with service",
            variant: "destructive",
          });
          return;
        }

        window.electron.send("open-external", data.url);
      } catch (error) {
        console.error("Error signing in:", error);
        toast({
          title: "Error",
          description: "Failed to authenticate with service",
          variant: "destructive",
        });
      }
    } else {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}${PATH_GOOGLE_INTEGRATION_OAUTH_CALLBACK}`,
          },
        });

        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error signing in:", error);
        toast({
          title: "Error",
          description: "Failed to authenticate with service",
          variant: "destructive",
        });
      }
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push(PATH_LOGIN);
  };

  const resetAuthState = () => {
    setActiveRole(null);
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

export const useAuthUser = () => {
  const supabase = createClient();
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

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
        setAuthUser(null);
      }
    });

    return () => {
      console.log("Unsubscribing from auth state change");
      subscription.unsubscribe();
    };
  }, []);

  const onboardingComplete: boolean =
    authUser?.user_metadata?.onboarding_complete ?? false;

  return {
    authUser,
    authLoading,
    refreshAuthUser,
    onboardingComplete,
  };
};
