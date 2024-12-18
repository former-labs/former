import { loginWithProvider } from "@/server/auth/actions";
import Link from "next/link";
import { Button } from "../../../components/ui/button";

export const FormLogin = () => {
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
          Login with Google
        </Button>
        <div className="flex justify-center text-sm text-gray-500">
          Don&apos;t have an account?&nbsp;
          <Link className="text-primary-600 font-semi" href="/sign-up">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};
