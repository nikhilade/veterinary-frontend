import { createFileRoute } from "@tanstack/react-router";
import { Home } from "@/components/site/Home";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PawCareOS | Veterinary Hospital Management Software" },
      {
        name: "description",
        content:
          "PawCareOS runs your veterinary hospital end to end: appointments, SOAP consultations, prescriptions, pharmacy stock, GST billing, analytics and a pet owner portal.",
      },
      { property: "og:title", content: "PawCareOS | Run Your Whole Hospital From One Console" },
      {
        property: "og:description",
        content:
          "One platform for appointments, clinical records, pharmacy, GST invoicing and analytics — with a branded portal for your pet owners. Start a 14-day free trial.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});
