"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface GoHomeButtonProps {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
}

export function GoHomeButton({ variant = "default" }: GoHomeButtonProps) {
  const router = useRouter();

  return (
    <Button onClick={() => router.push("/")} variant={variant}>
      Return Home
    </Button>
  );
}
