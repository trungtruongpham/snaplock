"use client";

import Script from "next/script";
import { createClient } from "@/lib/supabase/client";
import { CredentialResponse } from "google-one-tap";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useToast } from "@/hooks/use-toast";

// Create a context to expose the prompt function
interface GoogleOneTapContextType {
  promptOneTap: () => void;
}

const GoogleOneTapContext = createContext<GoogleOneTapContextType | undefined>(
  undefined
);

// Hook to use the Google One Tap context
export function useGoogleOneTap() {
  const context = useContext(GoogleOneTapContext);
  if (context === undefined) {
    throw new Error(
      "useGoogleOneTap must be used within a GoogleOneTapProvider"
    );
  }
  return context;
}

// Provider component that wraps the app
export function GoogleOneTapProvider({ children }: { children: ReactNode }) {
  const [promptFunction, setPromptFunction] = useState<() => void>(() => {
    // Default implementation if not initialized yet
    return () => {}; // No-op function instead of console.warn
  });

  return (
    <GoogleOneTapContext.Provider value={{ promptOneTap: promptFunction }}>
      <OneTapComponent setPromptFunction={setPromptFunction} />
      {children}
    </GoogleOneTapContext.Provider>
  );
}

// The actual One Tap component (now internal)
const OneTapComponent = ({
  setPromptFunction,
}: {
  setPromptFunction: (fn: () => void) => void;
}) => {
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // generate nonce to use for google id token sign-in
  const generateNonce = async (): Promise<string[]> => {
    const nonce = btoa(
      String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))
    );
    const encoder = new TextEncoder();
    const encodedNonce = encoder.encode(nonce);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encodedNonce);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedNonce = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return [nonce, hashedNonce];
  };

  useEffect(() => {
    // Only initialize if the script has loaded
    if (!scriptLoaded) return;

    // Check if user is already logged in
    const checkUserSession = async () => {
      const { data } = await supabase.auth.getSession();
      return !!data.session;
    };

    // Initialize Google One Tap
    const initializeGoogleOneTap = async () => {
      // Don't show One Tap if user is already logged in
      const isLoggedIn = await checkUserSession();
      if (isLoggedIn) return;

      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

      // Only initialize if client ID is available
      if (!clientId) {
        toast({
          variant: "destructive",
          title: "Configuration Error",
          description: "Google authentication is not properly configured.",
        });
        return;
      }

      try {
        // Generate a nonce - this is the original nonce that will be used for verification
        const [nonce, hashedNonce] = await generateNonce();

        // @ts-expect-error - google is defined globally by the script
        google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: CredentialResponse) => {
            try {
              toast({
                title: "Signing in...",
                description: "Please wait while we sign you in with Google",
              });

              // Use the original nonce for verification
              const { error } = await supabase.auth.signInWithIdToken({
                provider: "google",
                token: response.credential,
                nonce: nonce, // Use the original nonce, not a hashed version
              });

              if (error) {
                toast({
                  variant: "destructive",
                  title: "Sign-in Failed",
                  description: error.message || "Failed to sign in with Google",
                });
                return;
              }

              // Show success message
              toast({
                title: "Success",
                description: "You have been signed in with Google",
              });

              // Redirect to home page after successful sign-in
              router.push("/");
              router.refresh();
            } catch (error) {
              toast({
                variant: "destructive",
                title: "Sign-in Error",
                description: `An unexpected error occurred ${error}. Please try again.`,
              });
            }
          },
          auto_select: true,
          cancel_on_tap_outside: false,
          context: "signin",
          nonce: hashedNonce, // Use the same nonce for initialization
          use_fedcm_for_prompt: true,
        });

        // Create a function to prompt One Tap and expose it through context
        const promptOneTap = () => {
          try {
            // @ts-expect-error - google is defined globally by the script
            google.accounts.id.prompt((notification) => {
              if (
                notification.isNotDisplayed() ||
                notification.isSkippedMoment()
              ) {
                // One Tap is not displayed or was skipped
                toast({
                  variant: "destructive",
                  title: "Google Sign-In Unavailable",
                  description:
                    "Google Sign-In prompt couldn't be displayed. Please try again or use email login.",
                });
              }
            });
          } catch (error) {
            toast({
              variant: "destructive",
              title: "Error",
              description: `Failed to show Google Sign-In prompt. ${error}`,
            });
          }
        };

        // Expose the prompt function through the context
        setPromptFunction(() => promptOneTap);

        // Don't automatically prompt - wait for button click
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: `Failed to initialize Google sign-in. ${error}`,
        });
      }
    };

    initializeGoogleOneTap();
  }, [scriptLoaded, router, supabase.auth, toast, setPromptFunction]);

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onLoad={() => {
        setScriptLoaded(true);
      }}
    />
  );
};

export default GoogleOneTapProvider;
