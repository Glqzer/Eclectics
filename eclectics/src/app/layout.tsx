import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";
import Header from './_components/Header';

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend"
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
        <link rel="apple-touch-icon" sizes="180x180" href="/app/icon.png" />
      </head>
      <body className={`${lexend.className} antialiased`}>
        <div className="min-h-screen flex flex-col">
          {/* Header shows current user and logout */}
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="w-full border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black px-6 py-4 text-center text-sm text-gray-700 dark:text-gray-300">
            Add this website as an App!{' '}
            <a
              href="https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/26/ios/26"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:underline"
            >
              Here&apos;s how
            </a>
          </footer>
        </div>
      </body>
    </html>
  );
}

