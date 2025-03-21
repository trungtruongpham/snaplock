import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { UserProvider } from "@/hooks/use-user";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { createClient } from "@/lib/supabase/server";
import Script from "next/script";

// SEO metadata
export const metadata: Metadata = {
  title: {
    default: "SnapsLock Wallpapers | Beautiful Wallpapers for Your Device",
    template: "%s | SnapsLock Wallpapers",
  },
  description:
    "Download high-quality wallpapers for your phone, tablet, or desktop. SnapsLock offers a curated collection of beautiful wallpapers across various categories.",
  keywords: [
    "wallpapers",
    "phone wallpapers",
    "desktop backgrounds",
    "HD wallpapers",
    "free wallpapers",
    "mobile backgrounds",
  ],
  authors: [{ name: "SnapsLock Team" }],
  creator: "SnapsLock",
  publisher: "SnapsLock",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://snapslockwallpapers.com"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "SnapsLock Wallpapers | Beautiful Wallpapers for Your Device",
    description:
      "Download high-quality wallpapers for your phone, tablet, or desktop. SnapsLock offers a curated collection of beautiful wallpapers across various categories.",
    siteName: "SnapsLock Wallpapers",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "SnapsLock Wallpapers Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SnapsLock Wallpapers | Beautiful Wallpapers for Your Device",
    description:
      "Download high-quality wallpapers for your phone, tablet, or desktop. SnapsLock offers a curated collection of beautiful wallpapers across various categories.",
    images: ["/twitter-image.jpg"],
    creator: "@snapslockapp",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
    shortcut: "/favicon.ico",
  },
};

// Viewport metadata
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="schema-structured-data" type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "SnapsLock Wallpapers",
              "url": "${
                process.env.NEXT_PUBLIC_APP_URL ||
                "https://snapslockwallpapers.com"
              }",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "${
                  process.env.NEXT_PUBLIC_APP_URL ||
                  "https://snapslockwallpapers.com"
                }/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "description": "Download high-quality wallpapers for your phone, tablet, or desktop. SnapsLock offers a curated collection of beautiful wallpapers across various categories.",
              "publisher": {
                "@type": "Organization",
                "name": "SnapsLock",
                "logo": {
                  "@type": "ImageObject",
                  "url": "${
                    process.env.NEXT_PUBLIC_APP_URL ||
                    "https://snapslockwallpapers.com"
                  }/logo.png"
                }
              }
            }
          `}
        </Script>
        <Script id="collection-structured-data" type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              "name": "SnapsLock Wallpaper Collection",
              "description": "A curated collection of high-quality wallpapers for various devices",
              "url": "${
                process.env.NEXT_PUBLIC_APP_URL ||
                "https://snapslockwallpapers.com"
              }",
              "isPartOf": {
                "@type": "WebSite",
                "name": "SnapsLock Wallpapers",
                "url": "${
                  process.env.NEXT_PUBLIC_APP_URL ||
                  "https://snapslockwallpapers.com"
                }"
              }
            }
          `}
        </Script>
      </head>
      <body>
        <UserProvider initialUser={data.user ?? null}>
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
