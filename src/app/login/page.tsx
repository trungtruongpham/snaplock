"use client";

import { useTransition, useEffect, useCallback, useState, useRef } from "react";
import { login, signInWithGoogle } from "./action";
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
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const [isGoogleAuthPending, setIsGoogleAuthPending] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();
  const router = useRouter();
  const popupRef = useRef<Window | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Function to check if user is authenticated and redirect
  const checkUserAndRedirect = useCallback(async () => {
    console.log("Checking user authentication status...");
    try {
      const { data } = await supabase.auth.getUser();
      console.log(
        "Auth check result:",
        data.user ? "User authenticated" : "No user found"
      );
      if (data.user) {
        console.log("Redirecting authenticated user to home page");
        toast({
          title: "Success",
          description: "You have been logged in successfully",
        });
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      console.error("Error checking authentication status:", error);
    }
  }, [supabase, router, toast]);

  // Check localStorage for auth status as a fallback mechanism
  const checkLocalStorageAuth = useCallback(() => {
    try {
      const authSuccess = localStorage.getItem("auth_success");
      const authError = localStorage.getItem("auth_error");
      const timestamp = localStorage.getItem("auth_timestamp");

      // Only consider recent auth events (within last 30 seconds)
      const isRecent = timestamp && Date.now() - parseInt(timestamp) < 30000;

      if (authSuccess && isRecent) {
        console.log("Found recent auth success in localStorage");
        localStorage.removeItem("auth_success");
        localStorage.removeItem("auth_timestamp");
        checkUserAndRedirect();
        return true;
      } else if (authError && isRecent) {
        console.log("Found recent auth error in localStorage");
        localStorage.removeItem("auth_error");
        localStorage.removeItem("auth_timestamp");
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description:
            "There was an error during authentication. Please try again.",
        });
        setIsGoogleAuthPending(false);
        return true;
      }
    } catch (error) {
      console.error("Error checking localStorage:", error);
    }
    return false;
  }, [checkUserAndRedirect, toast]);

  // Clean up any existing popup check interval
  const cleanupPopupCheck = useCallback(() => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
  }, []);

  async function handleGoogleSignIn() {
    try {
      setIsGoogleAuthPending(true);

      // Clean up any existing popup check
      cleanupPopupCheck();

      // Close any existing popup
      if (popupRef.current && !popupRef.current.closed) {
        try {
          popupRef.current.close();
        } catch (error) {
          console.error("Error closing existing popup:", error);
        }
      }

      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2.5;

      console.log("Initiating Google sign-in process");
      const result = await signInWithGoogle();

      if (result?.error) {
        console.error("Error from signInWithGoogle:", result.error);
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
        setIsGoogleAuthPending(false);
        return;
      }

      if (result?.url) {
        console.log("Opening Google sign-in popup with URL:", result.url);
        // Open popup
        popupRef.current = window.open(
          result.url,
          "Google Sign In",
          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
        );

        if (!popupRef.current) {
          console.error(
            "Failed to open popup. It may have been blocked by the browser."
          );
          toast({
            variant: "destructive",
            title: "Popup Blocked",
            description: "Please allow popups for this site and try again.",
          });
          setIsGoogleAuthPending(false);
          return;
        }

        // Poll for changes in the popup
        checkIntervalRef.current = setInterval(() => {
          try {
            // This will throw an error if the popup is closed
            if (!popupRef.current || popupRef.current.closed) {
              console.log("Popup detected as closed");
              cleanupPopupCheck();

              // First check localStorage as a fallback
              if (!checkLocalStorageAuth()) {
                // If no localStorage data, check user auth status
                checkUserAndRedirect();
              }

              setIsGoogleAuthPending(false);
            } else {
              // Try to detect if we're on the success page by checking the URL
              try {
                const popupUrl = popupRef.current.location.href;
                console.log("Popup URL:", popupUrl);

                // If we can access the URL and it contains our callback path
                if (popupUrl.includes("/auth/callback")) {
                  console.log(
                    "Detected callback URL in popup, will check auth status"
                  );
                  // Wait a moment for the session to be established
                  setTimeout(() => {
                    cleanupPopupCheck();
                    checkUserAndRedirect();
                    setIsGoogleAuthPending(false);

                    // Try to close the popup
                    try {
                      if (popupRef.current && !popupRef.current.closed) {
                        popupRef.current.close();
                      }
                    } catch (e) {
                      console.error("Error closing popup:", e);
                    }
                  }, 1000);
                }
              } catch (urlError) {
                // Cross-origin error when trying to access popup URL, this is expected
                // Just continue polling
              }
            }
          } catch (error) {
            // If we can't access the popup, assume it's closed
            console.log("Cannot access popup, assuming it's closed:", error);
            cleanupPopupCheck();

            // First check localStorage as a fallback
            if (!checkLocalStorageAuth()) {
              // If no localStorage data, check user auth status
              checkUserAndRedirect();
            }

            setIsGoogleAuthPending(false);
          }
        }, 500);

        // Set a timeout to stop checking after 5 minutes (prevent infinite polling)
        setTimeout(() => {
          if (checkIntervalRef.current) {
            console.log("Timeout reached, stopping popup check");
            cleanupPopupCheck();

            // If still pending, reset state and show error
            if (isGoogleAuthPending) {
              setIsGoogleAuthPending(false);
              toast({
                variant: "destructive",
                title: "Authentication Timeout",
                description:
                  "The authentication process took too long. Please try again.",
              });
            }
          }
        }, 5 * 60 * 1000); // 5 minutes
      }
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initiate Google sign-in",
      });
      setIsGoogleAuthPending(false);
    }
  }

  useEffect(() => {
    console.log("Setting up message event listener");

    const handleMessage = async (event: MessageEvent) => {
      console.log("Received message:", event.data, "from", event.origin);

      // Accept messages from any origin for better compatibility
      if (event.data === "auth-complete") {
        console.log("Auth complete message received, checking user status");
        // Check if user is authenticated before redirecting
        await checkUserAndRedirect();
        setIsGoogleAuthPending(false);
      } else if (event.data === "auth-error") {
        console.error("Auth error message received");
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description:
            "There was an error during authentication. Please try again.",
        });
        setIsGoogleAuthPending(false);
      }
    };

    window.addEventListener("message", handleMessage);

    // Check if user is already authenticated on page load
    checkUserAndRedirect();

    // Also check localStorage for auth status (for cross-origin fallback)
    checkLocalStorageAuth();

    return () => {
      console.log("Cleaning up message event listener");
      window.removeEventListener("message", handleMessage);
      cleanupPopupCheck();
    };
  }, [
    toast,
    router,
    checkUserAndRedirect,
    checkLocalStorageAuth,
    cleanupPopupCheck,
  ]);

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
              disabled={isPending || isGoogleAuthPending}
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
              {isGoogleAuthPending ? "Signing in..." : "Sign in with Google"}
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
