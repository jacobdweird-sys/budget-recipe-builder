import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MainNav } from "@/components/main-nav";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EZ Recipes - Eat Well, Spend Less",
  description: "AI-powered budget meal planner. Scan your pantry, generate recipes within your budget, and plan meals for the week. Save money while eating well.",
  icons: {
    icon: [
      {
        url: "/favicon.png?v=1",
        sizes: "any",
        type: "image/png",
      },
      {
        url: "/favicon.png?v=1",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/favicon.png?v=1",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    shortcut: "/favicon.png?v=1",
    apple: "/favicon.png?v=1",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "EZ Recipes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <meta name="theme-color" content="#22c55e" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-200 transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <MainNav />
          <div className="flex-1">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
