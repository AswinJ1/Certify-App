import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Certify — Dynamic Certificate Platform",
  description: "Configuration-driven certificate generation platform with dynamic forms, CSV/XLSX mapping, and pdf-lib generation.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
