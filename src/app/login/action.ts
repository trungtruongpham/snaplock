"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function login(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  const formInput = loginSchema.safeParse({ email, password });

  if (!formInput.success) {
    return { error: "Invalid input" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formInput.data.email,
    password: formInput.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      queryParams: {
        prompt: "select_account", // Force account selection even if already logged in
      },
      skipBrowserRedirect: true, // Important: Let us handle the redirect in the client
    },
  });

  console.log(
    `Google sign-in initiated, URL: ${data?.url ? "generated" : "missing"}`
  );

  if (error) {
    console.error(`Google sign-in error: ${error.message}`);
    return { error: error.message };
  }

  return { url: data.url };
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
