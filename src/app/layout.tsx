import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { UserProvider } from "@/hooks/use-user";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "SnapLock",
  description:
    "SnapLock is a wallpaper app that allows you to lock your phone with a wallpaper.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <UserProvider>
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
