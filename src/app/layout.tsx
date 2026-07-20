import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VocoFlo Moment Coach",
  description: "A Build Week beta for text-based upcoming-moment speaking coaching."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
