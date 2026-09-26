import type { Metadata } from "next";
import { requireCustomerPage } from "@/lib/customerAuth";
import CheckoutClient from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Confirm your delivery address and place your Cash on Delivery order.",
};

export default async function CheckoutPage() {
  // Redirects to /login?redirect=%2Fcheckout when there is no valid session.
  // The cart is untouched by the redirect, so nothing is lost by signing in.
  const customer = await requireCustomerPage("/checkout");
  return <CheckoutClient customer={customer} />;
}
