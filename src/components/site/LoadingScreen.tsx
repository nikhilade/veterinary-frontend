import { useEffect, useState } from "react";
import kuttoGif from "@/assets/kutto.gif";

// One full loop of the running dog GIF.
const GIF_LOOP_MS = 520;

export function LoadingScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [gifLoaded, setGifLoaded] = useState(false);

  const dismiss = () => {
    setIsFading(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 400);
  };

  // Let the GIF play exactly one loop once it loads, then fade out.
  useEffect(() => {
    if (!gifLoaded) return;
    const timer = setTimeout(() => {
      dismiss();
    }, GIF_LOOP_MS);
    return () => clearTimeout(timer);
  }, [gifLoaded]);

  // Safety cap: if the image never loads or is slow, still fade out quickly.
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      dismiss();
    }, 1500);
    return () => clearTimeout(safetyTimer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#fff] transition-opacity duration-500 ease-out ${isFading ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
    >
      <div className="relative flex flex-col items-center justify-center p-4 text-center">
        <img
          src={kuttoGif}
          alt="Loading..."
          onLoad={() => setGifLoaded(true)}
          className="h-16 w-auto max-w-[120px] object-contain sm:h-20"
        />
        <div className="mt-3 h-1 w-24 overflow-hidden rounded-full bg-forest/15">
          <div className="h-full w-full animate-scale-x bg-forest" />
        </div>
      </div>
    </div>
  );
}


