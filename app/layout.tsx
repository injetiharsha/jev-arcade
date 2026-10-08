import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TraceProvider } from "@/context/TraceContext";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jev Arcade",
  description: "Interactive arcade powered by TypeSafe Jev System One model",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className="antialiased min-h-screen bg-gray-50 dark:bg-[#0d0a0f] text-gray-900 dark:text-[#f5f0f3] transition-colors duration-200 flex flex-col">
        <ThemeProvider>
          <TraceProvider>
            <Navbar />
            <div className="flex-1 flex flex-col">{children}</div>
          </TraceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
