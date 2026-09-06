"use client";

import { useState } from "react";

type Props = {
  images: string[];
};

export default function PropertyImageCarousel({ images }: Props) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) return null;

  const showPrev = () =>
    setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));

  const showNext = () =>
    setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));

  return (
    <div className="relative w-full h-64 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
      <img
        src={images[index]}
        alt="Property photo"
        className="w-full h-full object-cover"
      />

      <button
        type="button"
        onClick={showPrev}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-gray-700 flex items-center justify-center"
        aria-label="Previous photo"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={showNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-gray-700 flex items-center justify-center"
        aria-label="Next photo"
      >
        ›
      </button>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {images.map((_, i) => (
          <span
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${
              i === index ? "bg-white" : "bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}