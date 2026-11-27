import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GearCore Bot Dashboard",
  description: "Control panel for the GearCore.Store Discord bot.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
