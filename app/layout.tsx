import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenGhost — encrypted verdicts on-chain",
  description:
    "An on-chain registry that binds any id to a custom predicate contract and returns its verdict as a ciphertext only the caller can decrypt.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
