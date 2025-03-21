"use client";

import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ProviderInfo {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const providers: ProviderInfo[] = [
  {
    id: "google",
    name: "Google",
    icon: (
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
    ),
  },
];

export function LinkedAccounts({ user }: { user: User }) {
  const [isLinking, setIsLinking] = useState<string | null>(null);
  const [isUnlinking, setIsUnlinking] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  // Get the list of linked providers from user identities
  const linkedProviders =
    user.identities?.map((identity) => identity.provider) || [];

  const handleLinkProvider = async (providerId: string) => {
    setIsLinking(providerId);
    try {
      // For Google, we need to open a popup for OAuth
      if (providerId === "google") {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
            queryParams: {
              prompt: "consent",
              access_type: "offline",
            },
          },
        });

        if (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to link ${providerId}: ${error.message}`,
          });
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to link account: ${error}`,
      });
    } finally {
      setIsLinking(null);
    }
  };

  const handleUnlinkProvider = async (providerId: string) => {
    setIsUnlinking(providerId);
    try {
      // Currently, Supabase doesn't have a direct method to unlink providers
      // This would typically require a custom API endpoint
      toast({
        variant: "destructive",
        title: "Not Implemented",
        description: "Unlinking providers is not yet implemented.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to unlink account: ${error}`,
      });
    } finally {
      setIsUnlinking(null);
    }
  };

  return (
    <Card className="border-none sm:border shadow-none sm:shadow">
      <CardHeader>
        <CardTitle>Linked Accounts</CardTitle>
        <CardDescription>
          Connect your account with third-party providers for easier sign-in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {providers.map((provider) => {
          const isLinked = linkedProviders.includes(provider.id);
          const isLoading =
            isLinking === provider.id || isUnlinking === provider.id;

          return (
            <div
              key={provider.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border p-4 gap-4"
            >
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-muted p-2 flex-shrink-0">
                  {provider.icon}
                </div>
                <div>
                  <p className="font-medium">{provider.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {isLinked
                      ? `Connected with ${provider.name}`
                      : `Connect with ${provider.name}`}
                  </p>
                </div>
              </div>
              <Button
                variant={isLinked ? "destructive" : "outline"}
                size="sm"
                className="self-end sm:self-auto"
                disabled={isLoading}
                onClick={() =>
                  isLinked
                    ? handleUnlinkProvider(provider.id)
                    : handleLinkProvider(provider.id)
                }
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isLinked ? "Disconnect" : "Connect"}
              </Button>
            </div>
          );
        })}

        {/* Email provider is always present */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border p-4 gap-4">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-muted p-2 flex-shrink-0">
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <div>
              <p className="font-medium">Email</p>
              <p className="text-sm text-muted-foreground break-all">
                Connected with {user.email}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled
            className="self-end sm:self-auto"
          >
            Primary
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
