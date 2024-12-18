import { loginWithProvider } from "@/server/auth/actions";
import Link from "next/link";
import { Button } from "../../../components/ui/button";

export const FormSignup = () => {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-y-8">
        <Button
          variant="secondary"
          type="submit"
          onClick={async () =>
            await loginWithProvider({
              provider: "google",
            })
          }
        >
          Sign up with Google
        </Button>
        <div className="flex justify-center text-sm text-gray-500">
          Already have an account?&nbsp;
          <Link className="text-primary-600 font-semi" href="/login">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};
