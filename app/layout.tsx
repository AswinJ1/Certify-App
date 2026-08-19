import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Certify — Dynamic Certificate Platform",
  description: "Configuration-driven certificate generation platform with dynamic forms, CSV/XLSX mapping, and pdf-lib generation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("h-full antialiased")}>
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: "'Inter', 'Lusitana', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
