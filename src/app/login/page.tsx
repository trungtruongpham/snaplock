"use client";

import { useTransition, useEffect } from "react";
import { login } from "./action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GoogleOneTapProvider,
  useGoogleOneTap,
} from "@/components/auth/one-tap";

// Separate component for the login form to use the context
function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { promptOneTap } = useGoogleOneTap();

  // Check URL parameters for auth status
  useEffect(() => {
    const authParam = searchParams.get("auth");
    if (authParam === "success") {
      toast({
        title: "Success",
        description: "You have been logged in successfully",
      });
      router.push("/");
      router.refresh();
    } else if (authParam === "error") {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description:
          "There was an error during authentication. Please try again.",
      });
    }
  }, [searchParams, toast, router]);

  // Check if user is already authenticated on page load
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          router.push("/");
          router.refresh();
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to check authentication status. ${error}`,
        });
      }
    };

    checkUserSession();
  }, [supabase, router, toast]);

  async function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await login(formData);

      if (result?.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
        return;
      }

      toast({
        title: "Success",
        description: "You have been logged in successfully",
      });

      // Redirect will happen in the server action
    });
  }

  // Handle Google sign-in button click - this will trigger the One Tap UI
  const handleGoogleSignIn = () => {
    // Trigger the Google One Tap prompt
    promptOneTap();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>
            Enter your email and password to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Button
              variant="outline"
              type="button"
              disabled={isPending}
              onClick={handleGoogleSignIn}
              className="flex items-center justify-center gap-2"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </Button>
          </div>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">
              Don&apos;t have an account?{" "}
            </span>
            <Button variant="link" className="p-0" asChild>
              <Link href="/signup">Sign up</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Wrap the login form with the GoogleOneTapProvider
export default function LoginPage() {
  return (
    <GoogleOneTapProvider>
      <LoginForm />
    </GoogleOneTapProvider>
  );
}
