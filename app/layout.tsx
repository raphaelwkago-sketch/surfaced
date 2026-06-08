import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Surfaced — Search AI tools without the noise",
  description: "Find the right AI tool for the job. Search, compare, and discover AI tools without the noise.",
  metadataBase: new URL('https://surfaced-seven.vercel.app'),
  openGraph: {
    title: "Surfaced — Search AI tools without the noise",
    description: "Find the right AI tool for the job. Search, compare, and discover AI tools without the noise.",
    url: 'https://surfaced-seven.vercel.app',
    siteName: 'Surfaced',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
