import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { AuthFormOTP } from "./AuthFormOTP";

export const AuthFormComponent = () => {
  const { login } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAuth = async () => {
    setIsAuthenticating(true);
    await login();
  };

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        size="lg"
        className="w-full"
        onClick={handleAuth}
        disabled={isAuthenticating}
      >
        {isAuthenticating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Image
            src="https://www.google.com/favicon.ico"
            alt="Google"
            width={20}
            height={20}
          />
        )}
        Continue with Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <AuthFormOTP />
    </div>
  );
};
