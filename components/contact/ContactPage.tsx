import ContactHero from "@/components/contact/ContactHero";
import ContactInfo from "@/components/contact/ContactInfo";
import ContactForm from "@/components/contact/ContactForm";

/**
 * Contact page for Malmi Lifestyle. Real business details only — address and
 * phone number as supplied — with no invented email, hours, socials or map
 * coordinates. The form is a client component validated in-browser and marked
 * clearly as not connected to a backend yet.
 */
export default function ContactPage() {
  return (
    <>
      <ContactHero />
      <ContactInfo />
      <ContactForm />
    </>
  );
}