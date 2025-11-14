import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from './_components/Header';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eclectics",
  description: "Web App for Eclectics Dance Team",
  icons: {
    icon: '/app/favicon.ico',
    shortcut: '/app/favicon.ico'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/app/favicon.ico" />
        <link rel="shortcut icon" href="/app/favicon.ico" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen flex flex-col">
          {/* Header shows current user and logout */}
          <Header />
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}

