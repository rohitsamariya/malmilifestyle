import { redirect } from "next/navigation";
import AuthForm from "../login/AuthForm";
import { getCurrentCustomer } from "@/lib/customerAuth";
import { safeRedirectOr } from "@/lib/redirects";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect: requested } = await searchParams;
  const redirectTo = safeRedirectOr(requested, "/profile");

  if (await getCurrentCustomer()) redirect(redirectTo);

  return <AuthForm mode="register" redirectTo={redirectTo} />;
}
