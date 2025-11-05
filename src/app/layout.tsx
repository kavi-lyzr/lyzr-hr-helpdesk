import type { Metadata } from "next";
// import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/AuthProvider";

// const geistSans = localFont({
//   src: "./fonts/GeistVF.woff2",
//   variable: "--font-geist-sans",
//   weight: "100 900",
// });
// const geistMono = localFont({
//   src: "./fonts/GeistMonoVF.woff2",
//   variable: "--font-geist-mono",
//   weight: "100 900",
// });

export const metadata: Metadata = {
  title: "Katama Learning HR Helpdesk",
  description: "AI-powered HR helpdesk for multi-organizational support",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
          <link
            href="https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&display=swap"
            rel="stylesheet"
          />
          <link rel="icon" type="image/png" href="/favicon.png" />
      </head>
      <body>
        {/* className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      > */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster position="top-right" className="top-16 right-4 z-50" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}