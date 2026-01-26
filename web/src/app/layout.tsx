import type { Metadata } from "next";
// import { Inter, Space_Grotesk } from "next/font/google"; // Fonts disabled for build safety
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { FocusProvider } from "@/context/FocusContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { FocusOverlay } from "@/components/dashboard/FocusOverlay";

/*
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});
*/

export const metadata: Metadata = {
  title: "AURA - Life Operating System",
  description: "Manage your finances, health, and mind with AI.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning style={{ scrollBehavior: 'smooth' }} data-scroll-behavior="smooth">
      <body
        className={`antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          <LanguageProvider>
            <FocusProvider>
              <NotificationProvider>
                {children}
                <FocusOverlay />
              </NotificationProvider>
            </FocusProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
