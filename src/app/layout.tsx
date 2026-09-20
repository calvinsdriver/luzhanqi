import type { Metadata } from "next";
import { Russo_One, Chakra_Petch } from "next/font/google";
import "./globals.css";

const russoOne = Russo_One({
  variable: "--font-russo-one",
  subsets: ["latin"],
  weight: "400",
});

const chakraPetch = Chakra_Petch({
  variable: "--font-chakra-petch",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Luzhanqi Online",
  description: "Play Luzhanqi (Land Battle Chess) online with 2 or 4 players.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${russoOne.variable} ${chakraPetch.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-text">{children}</body>
    </html>
  );
}
