"use client";

import { useUser } from "@/hooks/use-user";
import { ProfileForm } from "@/components/profile/profile-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { LinkedAccounts } from "@/components/profile/linked-accounts";

export default function ProfilePage() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container flex justify-center py-10 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              You need to be logged in to view your profile.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 py-8 flex flex-col items-center">
        <div className="w-full max-w-3xl">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="accounts">Linked Accounts</TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="mt-0">
              <ProfileForm user={user} />
            </TabsContent>
            <TabsContent value="accounts" className="mt-0">
              <LinkedAccounts user={user} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
