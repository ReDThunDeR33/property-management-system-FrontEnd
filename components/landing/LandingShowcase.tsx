import Image from "next/image";

/* ============================================================
   LANDING SHOWCASE (Server Component)
   ------------------------------------------------------------
   COURSE CONCEPTS DEMONSTRATED HERE:
   • PROPS — the section receives ALL of its content (kicker,
     headline, intro, checklist and the image list) from the
     page via props; the component itself holds no content,
     exactly like the Task2 component examples.
   • next/image — the property screenshots are served through
     Next.js's optimized Image component (automatic WebP,
     responsive sizes, lazy loading). Lazy loading is ideal
     here because this section sits below the fold (the hero
     image uses `priority` instead).
   • .map() LIST RENDERING — both the checklist and the image
     gallery are rendered from arrays passed via props.
   • Visual design follows dwellix_landing_page_v4.html's
     "showcase" section: heading + checklist on one side,
     platform visuals on the other.
   ============================================================ */

export type ShowcaseImage = {
  src: string;
  alt: string;
  caption: string;
};

type LandingShowcaseProps = {
  kicker: string;
  titleTop: string;
  titleBottom: string;
  intro: string;
  checks: string[];
  images: ShowcaseImage[];
};

export default function LandingShowcase({
  kicker,
  titleTop,
  titleBottom,
  intro,
  checks,
  images,
}: LandingShowcaseProps) {
  return (
    <section id="platform" className="bg-white py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 lg:grid-cols-2">
        {/* Left: copy + checklist (all via props) */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-dwellix-500">
            {kicker}
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">
            {titleTop}
            <br />
            {titleBottom}
          </h2>
          <p className="mt-6 max-w-md text-sm leading-7 text-gray-500">{intro}</p>

          {/* "✓" checklist like the reference's .checks list */}
          <ul className="mt-8 space-y-3">
            {checks.map((check) => (
              <li key={check} className="flex items-start gap-3 text-sm text-gray-600">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-dwellix-500 text-[10px] font-bold text-white">
                  ✓
                </span>
                {check}
              </li>
            ))}
          </ul>

          <a
            href="/login"
            className="btn btn-primary btn-md mt-10"
          >
            Access your workspace →
          </a>
        </div>

        {/* Right: image gallery — next/image with lazy loading.
            First image large, remaining two in a row below it. */}
        <div className="space-y-4">
          <figure className="relative h-64 overflow-hidden rounded-md shadow-md md:h-80">
            <Image
              src={images[0].src}
              alt={images[0].alt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
          </figure>
          <div className="grid grid-cols-2 gap-4">
            {images.slice(1).map((image) => (
              <figure key={image.src} className="relative h-40 overflow-hidden rounded-md shadow-md md:h-48">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
              </figure>
            ))}
          </div>

          {/* Small caption strip under the gallery */}
          <div className="flex flex-wrap justify-between gap-2 pt-1">
            {images.map((image) => (
              <p key={image.src} className="text-[10px] uppercase tracking-widest text-gray-400">
                {image.caption}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
