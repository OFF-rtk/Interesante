import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/common/toast-provider";

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
    default: "Copyright Shield - AI-Powered Content Protection",
    template: "%s | Copyright Shield"
  },
  description: "Protect your content with AI-powered similarity detection and certificate generation. Get legal proof of ownership in under 10 seconds.",
  keywords: [
    "copyright protection",
    "AI content analysis", 
    "video similarity detection",
    "content ownership certificates",
    "digital rights management",
    "content verification"
  ],
  authors: [{ name: "Copyright Shield" }],
  creator: "Copyright Shield",
  metadataBase: new URL("https://copyrightshield.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://copyrightshield.com",
    siteName: "Copyright Shield",
    title: "Copyright Shield - AI-Powered Content Protection",
    description: "Protect your content with AI-powered similarity detection and certificate generation.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Copyright Shield - AI-Powered Content Protection",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Copyright Shield - AI-Powered Content Protection",
    description: "Protect your content with AI-powered similarity detection and certificate generation.",
    images: ["/og-image.png"],
    creator: "@copyrightshield",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
