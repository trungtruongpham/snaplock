"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ErrorPage() {
  const router = useRouter();

  return (
    <div className="h-screen w-full flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-semibold">Something went wrong</h2>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            An unexpected error occurred. Please try again later.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => router.push("/")} variant="default">
            Return Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
