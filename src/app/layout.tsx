import type { Metadata } from "next";
// import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Noto_Sans, Playfair_Display } from "next/font/google";
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

const noto_sans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});


export const metadata: Metadata = {
  title: "Lyzr HR Helpdesk",
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
            href="https://api.fontshare.com/v2/css?f[]=switzer@1,2&display=swap"
            rel="stylesheet"
          />
          <link rel="icon" href="/lyzr.png" />
      </head>
      <body className={`${noto_sans.variable} ${playfairDisplay.variable} antialiased`}>        
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