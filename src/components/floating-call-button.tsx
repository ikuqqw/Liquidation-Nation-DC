"use client";

import { STORE_INFO } from "@/lib/constants";

export function FloatingCallButton() {
  const digits = STORE_INFO.phone.replace(/[^0-9+]/g, "");
  const hasPlaceholder = STORE_INFO.phone.toLowerCase().includes("x");
  const phoneHref = hasPlaceholder ? "#" : `tel:${digits}`;

  return (
    <a
      href={phoneHref}
      onClick={(event) => {
        if (hasPlaceholder) {
          event.preventDefault();
        }
      }}
      aria-disabled={hasPlaceholder}
      aria-label="Call store"
      title="Call store"
      className={`fixed right-4 bottom-4 z-40 rounded-full border border-orange-500/45 bg-black/95 p-3 text-orange-300 shadow-[0_10px_30px_rgba(0,0,0,0.55)] backdrop-blur sm:right-6 sm:bottom-6 ${
        hasPlaceholder ? "cursor-not-allowed opacity-70" : "hover:bg-orange-500/10"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-6 w-6"
      >
        <path d="M6.62 10.79a15.46 15.46 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24 11.7 11.7 0 0 0 3.67.59 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.86a1 1 0 0 1 1 1 11.7 11.7 0 0 0 .59 3.67 1 1 0 0 1-.24 1.02z" />
      </svg>
    </a>
  );
}
