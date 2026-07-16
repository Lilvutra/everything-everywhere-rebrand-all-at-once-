import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Paper Rebrand Dashboard",
  description: "Vercel dashboard for paper rebrand debug workflows",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
