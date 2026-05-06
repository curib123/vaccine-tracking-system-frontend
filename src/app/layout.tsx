import type {
  Metadata,
  Viewport,
} from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ParentPwaRegistrar from "@/components/pwa/ParentPwaRegistrar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ImmuniTrack",
    template: "%s | ImmuniTrack",
  },
  description: "Immunization Management System for the health center.",
  manifest: "/manifest.webmanifest",
  applicationName: "ImmuniTrack Parent Portal",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ImmuniTrack",
  },
  icons: {
    icon: [
      {
        url: "/pwa-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/pwa-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    shortcut: "/pwa-icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ParentPwaRegistrar />
        {children}
      </body>
    </html>
  );
}
