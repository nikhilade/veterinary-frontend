import { useEffect, useRef, useState } from "react";
import vetCat from "@/assets/67447b6085bfcd89ce398084_veterinarian-taking-care-pet-1-p-500.webp";
import kidDog from "@/assets/67447b608bfcbd9f85ed0665_medium-shot-kid-cleaning-dog-1-p-500.webp";
import elderlyCorgi from "@/assets/67447b607a5550821b1472d1_elderly-person-spendng-tim-with-their-pets-1.webp";
import girlDog from "@/assets/67447b60fa15c36baeb8fc53_medium-shot-smiley-girl-holding-cute-dog-1.webp";
import womanPhone from "@/assets/67456aa8468107880fcbc97b_woman-posing-while-holding-dog-smartphone_1.webp";
import siamese from "@/assets/6746b9cb8fbb4801eee6a9b4_pretty-woman-playing-with-siamese-cat-1-p-500.webp";
import doctorCat from "@/assets/6746b9cb4b51a1c9b8676033_full-shot-doctor-holding-cat-with-leg-injury-1.webp";
import pawCircle from "@/assets/paw-circle.png";


const leftColumn = [
  { src: vetCat, alt: "Veterinarian listening to a fluffy cat's heartbeat" },
  { src: kidDog, alt: "Child gently brushing a dog at home" },
  { src: elderlyCorgi, alt: "Woman hugging her corgi on the sofa" },
];

const rightColumn = [
  { src: girlDog, alt: "Smiling woman holding a small brown dog" },
  { src: womanPhone, alt: "Woman carrying a jack russell terrier" },
  { src: siamese, alt: "Woman cradling a siamese cat" },
  { src: doctorCat, alt: "Veterinary nurse caring for a cat with a bandaged leg" },
];

function Column({
  items,
  offset,
  className = "",
}: {
  items: { src: string; alt: string }[];
  offset: number;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-6 will-change-transform ${className}`}
      style={{ transform: `translate3d(0, ${offset}px, 0)` }}
    >
      {[...items, ...items].map((img, i) => (
        <img
          key={i}
          src={img.src}
          alt={img.alt}
          loading="lazy"
          className="h-64 w-full rounded-[2rem] object-cover sm:h-80"
        />
      ))}
    </div>
  );
}

export function ScrollGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height + window.innerHeight;
      const p = (window.innerHeight - rect.top) / total;
      setProgress(Math.min(1, Math.max(0, p)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const shift = (progress - 0.5) * 320;

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-sand py-20 lg:py-28"
      aria-label="Moments from our clinic"
    >
      <img
        src={pawCircle}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="pointer-events-none absolute -left-8 top-0 -translate-x-1/2 -translate-y-1/2 z-0 size-96 animate-spin-slow md:size-[28rem] lg:size-[36rem] xl:size-[44rem]"
        style={{
          filter: "brightness(0.5) sepia(1) hue-rotate(120deg) saturate(3)",
        }}
      />
      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="relative z-10">
          <h2 className="text-4xl leading-tight sm:text-5xl">
            Every Visit Is a Happy Tail Story
          </h2>
          <p className="mt-6 max-w-md text-[17px] leading-relaxed text-foreground/80">
            Hospitals using PawCareOS see shorter queues, cleaner records and faster collections —
            while their pet owners book, pay and download prescriptions from their phone.
          </p>
          <a
            href="#contact"
            className="mt-9 inline-flex items-center gap-2 rounded-full border border-forest px-9 py-4 text-[16px] font-medium text-forest transition-colors hover:bg-forest hover:text-primary-foreground"
          >
            Request a demo
          </a>
        </div>

        <div className="relative h-[520px] overflow-hidden lg:h-[620px]">
          <div className="grid grid-cols-2 gap-6">
            <Column items={leftColumn} offset={-shift} className="-mt-24" />
            <Column items={rightColumn} offset={shift} className="-mt-24" />
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-sand to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-sand to-transparent" />
        </div>
      </div>
    </section>
  );
}
