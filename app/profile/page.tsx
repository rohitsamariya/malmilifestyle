import type { Metadata } from "next";
import ProfileClient from "./ProfileClient";

export const metadata: Metadata = {
  title: "Your Account",
  description:
    "Manage your orders, saved addresses and account details on Malmi Lifestyle.",
};

export default function ProfilePage() {
  return <ProfileClient />;
}
