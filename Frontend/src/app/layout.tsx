import type { Metadata } from "next";
import { Poppins, Familjen_Grotesk } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const familjenGrotesk = Familjen_Grotesk({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-familjen-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Adviser Portal | Sign In",
  description: "Enter your login details to access the Adviser portal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${familjenGrotesk.variable}`}>
      <body className={`${poppins.className} min-h-screen bg-slate-900 font-sans`}>
        {children}
      </body>
    </html>
  );
}
