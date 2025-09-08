import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "../components/ServiceWorkerRegister";
import { SessionProvider } from '../components/session-provider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Cricket Management App",
  description: "Complete cricket management system for teams, tournaments, and players",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
      <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />

      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          {children}
        </SessionProvider>
        {/* Register Service Worker */}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
