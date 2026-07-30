import { useEffect, useRef, useState } from "react";
import { Instagram } from "lucide-react";
import img1 from "@/assets/67459a3305d203a41fce8b5c_Mask-group-2.webp.asset.json";
import img2 from "@/assets/67459a33ff2837ab08e7f16c_Mask-group-1.webp.asset.json";
import img3 from "@/assets/67459a332f75502739bca3b7_Mask-group.webp.asset.json";
import img4 from "@/assets/67459a34be315ca7f02b1874_image-1.webp.asset.json";

// x / y are the final offsets from the centre of the section (vw / vh)
const items = [
  { src: img1.url, alt: "Woman holding two white pomeranian puppies", x: -38, y: -20, rot: -14 },
  { src: img2.url, alt: "Pomeranian dog sitting with golden baubles", x: 38, y: -22, rot: 12 },
  { src: img3.url, alt: "Woman kissing her husky", x: -36, y: 18, rot: 10 },
  { src: img4.url, alt: "Smiling woman cuddling her akita", x: 36, y: 20, rot: -12 },
];

export function InstagramSection() {
  const ref = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // The wrapper is taller than the viewport and the inner panel is sticky,
      // so the section stays pinned while this progress runs 0 -> 1.
      const distance = Math.max(1, rect.height - vh);
      const raw = -rect.top / distance;
      setProgress(Math.min(1, Math.max(0, raw)));
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

  // slight ease so the photos track the scroll almost 1:1 while pinned
  const e = progress * progress * (3 - 2 * progress) * 0.25 + progress * 0.75;

  return (
    <section
      ref={ref}
      id="instagram"
      className="relative bg-sand"
      aria-label="Stay Pawsome with us on Instagram"
      style={{ height: "220vh" }}
    >
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-20">
          {items.map((it, i) => (
            <img
              key={i}
              src={it.src}
              alt={it.alt}
              loading="lazy"
              className="absolute left-1/2 top-1/2 w-40 max-w-none will-change-transform sm:w-56 lg:w-72"
              style={{
                transform: `translate3d(calc(-50% + ${it.x * e}vw), calc(-50% + ${
                  it.y * e
                }vh), 0) rotate(${
                  it.rot * (e + 6 * Math.sin(Math.PI * progress))
                }deg)`,
                transformOrigin: "center",
              }}
            />
          ))}
        </div>


        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-4xl leading-tight sm:text-5xl lg:text-6xl">
            Stay Pawsome With Us
            <br />
            On Instagram
          </h2>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-3 text-[17px] text-foreground/85 hover:text-forest"
          >
            <Instagram className="size-6 text-clay" />
            Pet Care_Insta
          </a>
        </div>
      </div>
    </section>
  );
}

