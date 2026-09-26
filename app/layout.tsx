import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartToast from "@/components/cart/CartToast";
import { CartProvider } from "@/lib/cartContext";
import {
  CUSTOMER_SESSION_COOKIE,
  verifyCustomerSessionToken,
} from "@/lib/customer-session";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Malmi Lifestyle | Pure & Natural Foods",
    template: "%s | Malmi Lifestyle",
  },
  description:
    "Shop premium wood-pressed oils and naturally sourced food products from Malmi Lifestyle.",
  openGraph: {
    title: "Malmi Lifestyle | Pure & Natural Foods",
    description:
      "Wood-pressed oils and stone-ground flours, made the traditional way.",
    type: "website",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Cookie-signature only, no database hit: this just decides whether the
  // navbar icon points at the account or at the sign-in page. Every protected
  // page and API re-verifies the session against MongoDB.
  const cookieStore = await cookies();
  const isCustomerSignedIn =
    (await verifyCustomerSessionToken(cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value)) !== null;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-cream">
        <CartProvider>
          <Suspense fallback={null}>
            <Navbar isCustomerSignedIn={isCustomerSignedIn} />
          </Suspense>
          <div className="flex flex-1 flex-col">{children}</div>
          <Footer />
          <CartToast />
        </CartProvider>
      </body>
    </html>
  );
}
