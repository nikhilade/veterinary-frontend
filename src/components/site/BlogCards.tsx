import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight } from "lucide-react";

type Post = { title: string; author: string; date: string; img: string };

export function BlogCards({ posts }: { posts: Post[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ ease: "none" });

    const cards = gsap.utils.toArray<HTMLElement>("[data-card]", track);

    /* ---------- ripple elevation on hover ---------- */
    const ripple = (index: number, active: boolean) => {
      cards.forEach((card, i) => {
        const d = Math.abs(i - index);
        const falloff = 1 / (d + 1);
        gsap.to(card, {
          y: active ? -26 * falloff : 0,
          scale: active ? 1 + 0.05 * falloff : 1,
          rotate: active ? (i - index) * 1.5 : 0,
          boxShadow: active
            ? `0 ${18 * falloff + 4}px ${40 * falloff + 10}px rgba(20,40,25,${0.22 * falloff})`
            : "0 0px 0px rgba(20,40,25,0)",
          duration: 0.5 + d * 0.12,
          delay: active ? d * 0.07 : d * 0.04,
          ease: active ? "elastic.out(1, 0.6)" : "power2.out",
          overwrite: "auto",
        });
      });
    };

    const cleanups = cards.map((card, i) => {
      const enter = () => ripple(i, true);
      const leave = () => ripple(i, false);
      card.addEventListener("mouseenter", enter);
      card.addEventListener("mouseleave", leave);
      return () => {
        card.removeEventListener("mouseenter", enter);
        card.removeEventListener("mouseleave", leave);
      };
    });

    /* ---------- horizontal scroll (desktop only) ---------- */
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px)", () => {
        const getDistance = () => Math.max(0, track.scrollWidth - section.offsetWidth);
        const tween = gsap.to(track, {
          x: () => -getDistance(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => "+=" + getDistance(),
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
          gsap.set(track, { x: 0 });
        };
      });
    }, section);

    return () => {
      cleanups.forEach((fn) => fn());
      gsap.killTweensOf(cards);
      ctx.revert();
    };
  }, [posts.length]);

  return (
    <div ref={sectionRef} className="mt-14 overflow-hidden md:flex md:h-screen md:items-center">
      <div ref={trackRef} className="flex w-max gap-8 max-md:w-full max-md:flex-col">
        {posts.map((p) => (
          <article
            key={p.title}
            data-card
            className="w-full cursor-pointer rounded-[2rem] bg-card p-5 will-change-transform md:w-[calc((100vw-3rem-4rem)/3)] md:max-w-[26rem]"
          >
            <img
              src={p.img}
              alt={p.title}
              loading="lazy"
              width={800}
              height={600}
              className="h-52 w-full rounded-[1.5rem] object-cover"
            />
            <h3 className="mt-6 text-xl leading-snug">{p.title}</h3>
            <div className="mt-4 flex items-center justify-between text-sm text-foreground/70">
              <span>
                {p.author} · {p.date}
              </span>
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-forest text-primary-foreground">
                <ArrowUpRight className="size-4" />
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
