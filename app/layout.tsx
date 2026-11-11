import type { Metadata } from "next";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/press-start-2p/400.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "ryu-deco — Your little pixel world",
  description:
    "Decorate your GitHub, pixel by pixel. Create your own cozy pixel developer card and take it to your README.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
