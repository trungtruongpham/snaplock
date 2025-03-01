import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { UserProvider } from "@/hooks/use-user";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "SnapLock",
  description:
    "SnapLock is a wallpaper app that allows you to lock your phone with a wallpaper.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <UserProvider initialUser={data.session?.user ?? null}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Header />
            {children}
            <Footer />
          </ThemeProvider>
        </UserProvider>
      </body>
    </html>
  );
}
