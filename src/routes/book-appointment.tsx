import { createFileRoute, Link } from "@tanstack/react-router";
import { PawPrint } from "lucide-react";
import { BookingForm } from "@/components/app/BookingForm";

export const Route = createFileRoute("/book-appointment")({
  head: () => ({
    meta: [
      { title: "Book an Appointment | Pet Good Veterinary Clinic" },
      {
        name: "description",
        content:
          "Book a veterinary, grooming, boarding or training appointment with the Pet Good team in Los Angeles.",
      },
      { property: "og:title", content: "Book an Appointment | Pet Good" },
      { property: "og:description", content: "Choose your pet, service, doctor and time in under a minute." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BookAppointmentPage,
});

function BookAppointmentPage() {
  return (
    <div className="min-h-screen bg-sage py-12">
      <div className="mx-auto max-w-3xl px-6">
        <Link to="/" className="flex items-center text-2xl font-bold text-forest">
          Pet G<PawPrint className="inline size-5 -rotate-12 text-clay" />
          od
        </Link>
        <h1 className="mt-8 text-4xl leading-tight sm:text-5xl">Book an Appointment</h1>
        <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-foreground/80">
          Pick your pet, the service you need and a time that suits you. Already registered?{" "}
          <Link to="/login" className="font-medium text-clay">
            Sign in
          </Link>{" "}
          to see your full history.
        </p>

        <div className="mt-10 rounded-[2rem] bg-card p-8">
          <BookingForm />
        </div>
      </div>
    </div>
  );
}
