import { redirect } from "next/navigation";
import AuthForm from "./AuthForm";
import { getCurrentCustomer } from "@/lib/customerAuth";
import { safeRedirectOr } from "@/lib/redirects";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect: requested } = await searchParams;
  const redirectTo = safeRedirectOr(requested, "/profile");

  // An already-signed-in customer never needs this page.
  if (await getCurrentCustomer()) redirect(redirectTo);

  return <AuthForm mode="login" redirectTo={redirectTo} />;
}
