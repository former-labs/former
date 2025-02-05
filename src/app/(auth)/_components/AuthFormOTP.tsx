import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PATH_HOME } from "@/lib/paths";
import { createClient } from "@/lib/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const emailFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const otpFormSchema = z.object({
  otp: z.string().min(6, "Please enter a valid OTP code"),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;
type OTPFormValues = z.infer<typeof otpFormSchema>;

export const AuthFormOTP = () => {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");
  const [otpError, setOtpError] = useState("");

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const otpForm = useForm<OTPFormValues>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: {
      otp: "",
    },
  });

  const handleEmailAuth = async (values: EmailFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: values.email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        throw error;
      }

      setEmail(values.email);
      setEmailSent(true);
    } catch (error) {
      console.error("Error sending OTP:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerify = async (values: OTPFormValues) => {
    setIsLoading(true);
    setOtpError("");
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: values.otp,
        type: "email",
      });

      if (error) {
        throw error;
      }

      // If we don't refresh, stuff is weird
      window.location.href = PATH_HOME;
    } catch (error) {
      // console.error("Error verifying OTP:", error);
      setOtpError("Invalid or expired OTP code. Please try again.");
      otpForm.reset({ otp: "" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!emailSent) {
    return (
      <Form {...emailForm}>
        <form
          onSubmit={emailForm.handleSubmit(handleEmailAuth)}
          className="space-y-2"
        >
          <FormField
            control={emailForm.control}
            name="email"
            key="otp-email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="text" placeholder="Email address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Email me a one time password"
            )}
          </Button>
        </form>
      </Form>
    );
  }

  return (
    <Form {...otpForm}>
      <form
        onSubmit={otpForm.handleSubmit(handleOTPVerify)}
        className="space-y-2"
      >
        <p className="mb-4 px-8 text-center text-sm text-muted-foreground">
          We just emailed you a 6 digit code, please enter it below.
        </p>
        <FormField
          control={otpForm.control}
          name="otp"
          key="otp-form"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="text" placeholder="e.g. 123456" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {otpError && <p className="text-sm text-destructive">{otpError}</p>}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Verify OTP"
          )}
        </Button>
      </form>
    </Form>
  );
};
