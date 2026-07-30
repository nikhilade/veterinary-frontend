import { PawPrint, Phone, Mail, MapPin, Facebook, Instagram, Twitter, Linkedin, ArrowUpRight } from "lucide-react";
import { Nav } from "./Nav";
import { ScrollGallery } from "./ScrollGallery";
import { InstagramSection } from "./InstagramSection";
import { Reveal } from "./Reveal";

import dogsHero from "@/assets/dogs-hero.webp.asset.json";
import dogHead from "@/assets/dog-head.webp.asset.json";
import dogFace from "@/assets/dog-face.png.asset.json";
import dogLeft from "@/assets/dog-left.png.asset.json";
import frameArrow from "@/assets/frame-arrow.svg.asset.json";
import logo1 from "@/assets/logo-1.svg.asset.json";
import logo2 from "@/assets/logo-2.svg.asset.json";
import logo3 from "@/assets/logo-3.svg.asset.json";
import logo4 from "@/assets/logo-4.svg.asset.json";
import aboutVet from "@/assets/about-vet.jpg";
import serviceVet from "@/assets/service-vet.jpg";
import serviceGrooming from "@/assets/service-grooming.jpg";
import serviceBoarding from "@/assets/service-boarding.jpg";
import serviceTraining from "@/assets/service-training.jpg";
import serviceSpecial from "@/assets/service-special.jpg";
import testimonial1 from "@/assets/testimonial-1.jpg";
import blog1 from "@/assets/blog-1.jpg";
import blog2 from "@/assets/blog-2.jpg";
import blog3 from "@/assets/blog-3.jpg";
import blog4 from "@/assets/blog-4.jpg";
import blog5 from "@/assets/blog-5.jpg";
import blog6 from "@/assets/blog-6.jpg";
import blog7 from "@/assets/blog-7.jpg";
import blog8 from "@/assets/blog-8.jpg";
import { BlogCards } from "@/components/site/BlogCards";

const services = [
  {
    title: "Veterinary Care",
    copy: "Routine check-ups, vaccinations, diagnostics and emergency treatment from licensed veterinarians who know your pet by name.",
    img: serviceVet,
  },
  {
    title: "Grooming Services",
    copy: "Baths, trims, nail care and de-shedding treatments that keep coats healthy and tails wagging all year round.",
    img: serviceGrooming,
  },
  {
    title: "Boarding & Daycare",
    copy: "Cosy overnight suites and supervised play days so your companion feels at home even when you are away.",
    img: serviceBoarding,
  },
  {
    title: "Training Services",
    copy: "Positive-reinforcement obedience and behaviour programmes built around your pet's pace and personality.",
    img: serviceTraining,
  },
  {
    title: "Special Care Services",
    copy: "Post-surgery recovery, senior support and chronic condition management with attentive daily monitoring.",
    img: serviceSpecial,
  },
];

const posts = [
  { title: "Top Foods for a Healthy Pet Diet", author: "Brooklyn Simmons", date: "November 28, 2024", img: blog1 },
  { title: "Holiday Safety Tips for Your Pets", author: "Isabella Parker", date: "November 28, 2024", img: blog2 },
  { title: "How to Stop Unwanted Chewing", author: "Sophia Bennett", date: "November 28, 2024", img: blog3 },
  { title: "Grooming Routines That Keep Coats Shiny", author: "Ethan Brooks", date: "December 4, 2024", img: blog4 },
  { title: "Keeping Your Cat Hydrated All Year", author: "Maya Torres", date: "December 11, 2024", img: blog5 },
  { title: "Daily Exercise Ideas for Active Dogs", author: "Liam Carter", date: "December 18, 2024", img: blog6 },
  { title: "Dental Care Basics Every Owner Needs", author: "Dr. Amelia Reed", date: "January 6, 2025", img: blog7 },
  { title: "Creating a Calm Sleep Space for Kittens", author: "Noah Fletcher", date: "January 15, 2025", img: blog8 },
];

const sponsors = [logo4.url, logo1.url, logo3.url, logo2.url];

export function Home() {
  return (
    <div className="[overflow-x:clip]">
      {/* HERO */}
      <section id="home" className="relative bg-sage">
        <div className="paw-field absolute inset-0 opacity-70" aria-hidden />
        <div className="relative">
          <Nav />
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 pb-0 pt-8 lg:grid-cols-2 lg:pt-16">
            <div className="pb-12 lg:pb-28">
              <p className="text-lg font-medium text-clay">The Best Pet Care Service</p>
              <h1 className="mt-4 text-5xl leading-[1.1] sm:text-6xl lg:text-[64px]">
                Where Happy Pets
                <br />
                Meet Expert Care
              </h1>
              <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-foreground/80">
                Compassionate veterinary medicine, grooming and daycare under one roof — because
                your companion deserves a team that treats them like family.
              </p>
              <a
                href="#contact"
                className="mt-9 inline-flex items-center gap-2 rounded-full border border-forest px-9 py-4 text-[16px] font-medium text-forest transition-colors hover:bg-forest hover:text-primary-foreground"
              >
                Get Started
              </a>
            </div>

            <div className="relative flex items-end justify-center">
              <img
                src={dogHead.url}
                alt="Illustrated dog head"
                className="pointer-events-none absolute left-[46%] top-[2%] w-[28%] animate-wiggle"
              />
              <img
                src={dogsHero.url}
                alt="Illustrated husky, great dane, dalmatian and bulldog sitting together"
                className="w-full max-w-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="bg-sand py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
            <h2 className="max-w-xl text-4xl leading-tight sm:text-5xl">
              Loving Pets Is What We
              <br className="hidden lg:inline" />
              Do Best
            </h2>
            <img
              src={frameArrow.url}
              alt=""
              className="hidden h-24 w-auto shrink-0 lg:block"
              aria-hidden="true"
            />
          </div>

          <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:items-center">
            <img
              src={aboutVet}
              alt="Veterinarian holding a happy golden dog"
              loading="lazy"
              width={900}
              height={1100}
              className="h-[440px] w-full rounded-[2.5rem] object-cover lg:h-[520px]"
            />

            <div>
              <p className="text-[17px] leading-relaxed text-foreground/80">
                From the first wagging-tail welcome to the follow-up call after treatment, every
                part of our clinic is designed around comfort. Our veterinarians, groomers and
                daycare team work together so your pet gets consistent, gentle care at every visit.
              </p>

              <div className="mt-10 grid gap-8 sm:grid-cols-2">
                {[
                  {
                    title: "Passion for pets",
                    copy: "We are pet owners first — every animal in our care is treated like our own.",
                  },
                  {
                    title: "Expertise & experience",
                    copy: "Over fifteen years of clinical practice across preventive and emergency care.",
                  },
                ].map((f) => (
                  <div key={f.title}>
                    <span className="inline-flex size-12 items-center justify-center rounded-full bg-forest">
                      <PawPrint className="size-6 text-primary-foreground" />
                    </span>
                    <h3 className="mt-4 text-xl">{f.title}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-foreground/75">{f.copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SPONSORS */}
      <section className="bg-cream py-14">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-6 lg:flex-row lg:justify-between">
          <h3 className="shrink-0 text-center text-2xl font-bold lg:text-3xl lg:text-left">
            Our Generous Sponsors
            <br />
            and Donors
          </h3>
          <div className="relative w-full overflow-hidden lg:w-auto">
            <div className="marquee-track flex w-max items-center gap-12 pr-12 lg:gap-16 lg:pr-16">
              {[...sponsors, ...sponsors, ...sponsors, ...sponsors].map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="Sponsor logo"
                  loading="lazy"
                  className="h-10 w-auto shrink-0 lg:h-12"
                />
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-cream to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-cream to-transparent" />
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="bg-background py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mx-auto max-w-3xl text-center text-4xl leading-tight sm:text-5xl">
            Expert Care for Every Stage of Your Pet's Life
          </h2>

          <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <article
                key={s.title}
                className="group relative overflow-hidden rounded-[2rem] border-y-2 border-dashed border-clay/60 bg-cream px-6 py-10 text-center"
              >
                <img
                  src={s.img}
                  alt={s.title}
                  loading="lazy"
                  width={800}
                  height={600}
                  className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-56 w-56 -translate-x-1/2 -translate-y-1/2 scale-75 rotate-0 rounded-[1.5rem] object-cover opacity-0 shadow-xl transition-all duration-500 ease-out group-hover:scale-100 group-hover:rotate-6 group-hover:opacity-100"
                />
                <h3 className="text-2xl transition-opacity duration-300 group-hover:opacity-30">
                  {s.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-foreground/75 transition-opacity duration-300 group-hover:opacity-30">
                  {s.copy}
                </p>
                <a
                  href="#contact"
                  className="relative z-20 mt-6 inline-flex items-center gap-2 text-[15px] font-medium text-clay"
                >
                  Book now <ArrowUpRight className="size-4" />
                </a>
              </article>
            ))}
          </div>

        </div>
      </section>

      {/* SCROLLING GALLERY */}
      <ScrollGallery />

      {/* TESTIMONIAL */}
      <section className="relative overflow-hidden bg-forest py-20 lg:py-28">
        <div className="paw-field absolute inset-0 opacity-100 invert" aria-hidden />
        <div className="relative mx-auto max-w-5xl px-6">
          <h2 className="max-w-2xl text-4xl leading-tight text-primary-foreground sm:text-5xl">
            Every Visit Is a Happy Tail Story
          </h2>
        </div>
        <div className="relative mx-auto mt-12 grid max-w-5xl items-center gap-10 px-6 md:grid-cols-[220px_1fr]">
          <img
            src={testimonial1}
            alt="Sarah Johnson holding her dog Max"
            loading="lazy"
            width={700}
            height={700}
            className="size-52 rounded-full object-cover"
          />
          <div>
            <blockquote className="text-3xl leading-snug text-primary-foreground sm:text-4xl">
              &ldquo;She&apos;s not just a pet, she&apos;s our cuddle buddy — and this team treats
              her exactly that way.&rdquo;
            </blockquote>
            <p className="mt-6 text-lg font-semibold text-primary-foreground">Sarah Johnson</p>
            <p className="text-sm text-primary-foreground/70">Dog — Max</p>
          </div>
        </div>
      </section>


      {/* BLOG */}
      <section id="blog" className="bg-sand py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-4xl leading-tight sm:text-5xl">Unleashing Expert Tips for Pet Owners</h2>

          <BlogCards posts={posts} />
        </div>
      </section>

      {/* INSTAGRAM */}
      <InstagramSection />

      {/* CONTACT */}
      <section id="contact" className="bg-background py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-4xl leading-tight sm:text-5xl">Have Questions? We&apos;re Here to Help</h2>
            <ul className="mt-10 space-y-6">
              {[
                { icon: Phone, text: "(00) 123 654 987" },
                { icon: Mail, text: "info@petgood.com" },
                { icon: MapPin, text: "9400 S Normandie Ave #14, Los Angeles, CA" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-4">
                  <span className="inline-flex size-12 items-center justify-center rounded-full bg-cream text-forest">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-[16px] text-foreground/85">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <form
            className="rounded-[2rem] bg-cream p-8"
            onSubmit={(e) => {
              e.preventDefault();
              (e.currentTarget as HTMLFormElement).reset();
            }}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <input
                required
                placeholder="Your name"
                className="rounded-full border border-border bg-card px-5 py-3 text-[15px] outline-none focus:border-forest"
              />
              <input
                required
                type="email"
                placeholder="Email address"
                className="rounded-full border border-border bg-card px-5 py-3 text-[15px] outline-none focus:border-forest"
              />
            </div>
            <select
              className="mt-5 w-full rounded-full border border-border bg-card px-5 py-3 text-[15px] outline-none focus:border-forest"
              defaultValue=""
            >
              <option value="" disabled>
                Choose Service...
              </option>
              {services.map((s) => (
                <option key={s.title}>{s.title}</option>
              ))}
            </select>
            <textarea
              rows={4}
              placeholder="Tell us about your pet"
              className="mt-5 w-full rounded-[1.5rem] border border-border bg-card px-5 py-4 text-[15px] outline-none focus:border-forest"
            />
            <button
              type="submit"
              className="mt-6 rounded-full bg-forest px-9 py-4 font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Send Message
            </button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <div aria-hidden className="relative z-10 -mb-px block bg-background leading-[0]">
        <img
          src={dogLeft.url}
          alt=""
          className="absolute bottom-2 left-0 z-0 w-36 lg:w-36"
        />
        <img
          src={dogFace.url}
          alt=""
          className="absolute bottom-2 right-0 z-0 w-24 translate-x-0 lg:w-24"
        />
        <svg
          viewBox="0 0 1200 60"
          preserveAspectRatio="none"
          className="relative z-10 block h-6 w-full"
        >
          <path
            fill="currentColor"
            className="text-forest"
            d="M0,60 L0,30 C25,4 75,4 100,30 C125,56 175,56 200,30 C225,4 275,4 300,30 C325,56 375,56 400,30 C425,4 475,4 500,30 C525,56 575,56 600,30 C625,4 675,4 700,30 C725,56 775,56 800,30 C825,4 875,4 900,30 C925,56 975,56 1000,30 C1025,4 1075,4 1100,30 C1125,56 1175,56 1200,30 L1200,60 Z"
          />
        </svg>
      </div>
      <footer className="bg-forest pb-16 pt-8 text-primary-foreground">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-3">
          <Reveal>
            <span className="flex items-center text-2xl font-bold">
              pet g<PawPrint className="inline size-5 -rotate-12 text-clay" />od
            </span>
            <p className="mt-4 max-w-xs text-sm text-primary-foreground/75">
              Full-service veterinary care, grooming and daycare for the pets of Los Angeles.
            </p>
            <div className="mt-6 flex gap-3">
              {[Facebook, Instagram, Twitter, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#contact"
                  aria-label="Social link"
                  className="inline-flex size-10 items-center justify-center rounded-full border border-primary-foreground/30 transition-colors hover:bg-primary-foreground/10"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </Reveal>

          <Reveal delay={120}>
            <h3 className="text-lg text-primary-foreground">Quick Link</h3>
            <ul className="mt-4 space-y-3 text-sm text-primary-foreground/75">
              {["Home", "About us", "Services", "Blog", "Contact us"].map((l) => (
                <li key={l}>
                  <a href="#home" className="hover:text-clay">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={240}>
            <h3 className="text-lg text-primary-foreground">Support</h3>
            <ul className="mt-4 space-y-3 text-sm text-primary-foreground/75">
              {["Appointments", "Emergency care", "Pricing"].map((l) => (
                <li key={l}>
                  <a href="#contact" className="hover:text-clay">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
        <Reveal delay={360} className="mx-auto mt-12 max-w-7xl px-6">
          <p className="text-xs text-primary-foreground/60">
            © {new Date().getFullYear()} Pet Good Veterinary Clinic. All rights reserved.
          </p>
        </Reveal>

      </footer>
    </div>
  );
}
