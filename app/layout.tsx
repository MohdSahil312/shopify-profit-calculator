import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Shopify Profit Calculator | Mohd Sahil Shaikh",
  description:
    "Calculate your actual Shopify profit after product cost, shipping, ad spend and payment gateway fees. Free tool by Mohd Sahil Shaikh.",
  keywords:
    "shopify profit calculator, ecommerce profit margin, dropshipping calculator, shopify ROI, shopify margin tool",
  openGraph: {
    title: "Shopify Profit Calculator | Mohd Sahil Shaikh",
    description:
      "Calculate your actual Shopify profit after product cost, shipping, ad spend and payment gateway fees.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
