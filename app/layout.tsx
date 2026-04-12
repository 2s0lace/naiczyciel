import type { Metadata } from "next";
import { Figtree, Gloria_Hallelujah, Great_Vibes, Inter, Prompt } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { SiteNavbar } from "@/components/layout/site-navbar";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["400", "500", "700", "800"],
});

const prompt = Prompt({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["800", "900"],
  variable: "--font-prompt",
});

const figtree = Figtree({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["900"],
  variable: "--font-figtree",
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
  variable: "--font-great-vibes",
});

const gloriaHallelujah = Gloria_Hallelujah({
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
  variable: "--font-gloria-hallelujah",
});

export const metadata: Metadata = {
  title: "nAIczyciel Platforma",
  description: "Twoja platforma edukacyjna",
  icons: {
    icon: "/img/naiczyciel_logo.png",
    shortcut: "/img/naiczyciel_logo.png",
    apple: "/img/naiczyciel_logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={`${inter.className} ${prompt.variable} ${figtree.variable} ${greatVibes.variable} ${gloriaHallelujah.variable} bg-app text-app antialiased`}>
        <div className="min-h-screen">
          <SiteNavbar />
          <main>{children}</main>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
