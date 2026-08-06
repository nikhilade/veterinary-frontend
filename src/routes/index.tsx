import { createFileRoute } from "@tanstack/react-router";
import { Home } from "@/components/site/Home";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PawCareOS | Veterinary Care, Grooming & Daycare in Los Angeles" },
      {
        name: "description",
        content:
          "PawCareOS is a full-service veterinary clinic in Los Angeles offering expert vet care, grooming, boarding, daycare and training for happy, healthy pets.",
      },
      { property: "og:title", content: "PawCareOS | Where Happy Pets Meet Expert Care" },
      {
        property: "og:description",
        content:
          "Veterinary care, grooming, boarding and training under one roof. Book an appointment with the PawCareOS team today.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});
