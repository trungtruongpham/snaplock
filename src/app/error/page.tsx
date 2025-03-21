import { Metadata } from "next";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { XCircle } from "lucide-react";
import { GoHomeButton } from "@/components/navigation/GoHomeButton";

export const metadata: Metadata = {
  title: "Error | SnapLock",
  description: "Something went wrong. We apologize for the inconvenience.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ErrorPage() {
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
          <GoHomeButton variant="default" />
        </CardFooter>
      </Card>
    </div>
  );
}
