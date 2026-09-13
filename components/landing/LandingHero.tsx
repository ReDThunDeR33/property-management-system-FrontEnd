import Image from "next/image";

/* ============================================================
   LANDING HERO (Server Component)
   ------------------------------------------------------------
   Course concepts demonstrated here:
   • A presentational Server Component — it renders whatever
     data its parent passes via PROPS (headline, copy, image...).
     No state, no effects → no need to be a client component.
   • PROPS pattern identical to Task2's component/header.tsx.
   • next/image (Task2 uses it too) serves the optimized hero
     photo — the image itself is passed via props from the page.
   • Visual design follows dwellix_landing_page_v4.html:
     big split headline ("Property management, without the
     mess."), orange eyebrow, photo with floating stat cards.
   ============================================================ */

type LandingHeroProps = {
  eyebrow: string;
  headlineTop: string;
  headlineBottom: string;
  copy: string;
  imageSrc: string;
  imageAlt: string;
};

export default function LandingHero({
  eyebrow,
  headlineTop,
  headlineBottom,
  copy,
  imageSrc,
  imageAlt,
}: LandingHeroProps) {
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-14 pt-16 md:grid-cols-2">
        {/* Left: text column */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-dwellix-500">
            {eyebrow}
          </p>

          {/* The second half of the headline is orange, like the reference */}
          <h1 className="mt-5 max-w-xl text-5xl font-bold leading-[0.95] tracking-tight md:text-7xl">
            {headlineTop}{" "}
            <span className="text-dwellix-500">{headlineBottom}</span>
          </h1>

          <p className="mt-6 max-w-md text-[15px] leading-7 text-gray-500">
            {copy}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#how" className="btn btn-primary btn-md">
              Explore Dwellix →
            </a>
            <a
              href="#roles"
              className="btn btn-md border-gray-400 bg-white text-gray-800 hover:border-gray-800 hover:bg-white"
            >
              See how it works
            </a>
          </div>

          <p className="mt-7 text-[11px] text-gray-400">
            <strong className="text-gray-600">Connected property operations</strong>{" "}
            — Properties · Payments · Issues · Work Orders
          </p>
        </div>

        {/* Right: photo with floating cards (image via props) */}
        <div className="relative">
          <div className="relative h-[420px] overflow-hidden rounded-md shadow-sm md:h-[500px]">
            {/* next/image: optimized, lazy-loaded by default;
                priority because the hero is above the fold */}
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          {/* Floating "unit" card (bottom-left) */}
          <div className="absolute bottom-6 -left-2 w-56 rounded-md bg-white p-4 shadow-xl md:left-6">
            <p className="text-[10px] uppercase tracking-widest text-gray-400">
              Occupancy
            </p>
            <p className="mt-1 text-xl font-bold">78%</p>
            <p className="text-[11px] text-gray-500">46 of 59 units occupied</p>
          </div>

          {/* Floating stat card (top-right, orange like the reference) */}
          <div className="absolute right-4 top-7 min-w-36 bg-dwellix-500 p-4 text-white shadow-lg">
            <p className="text-2xl font-bold">24</p>
            <p className="text-[10px] opacity-90">Work orders resolved</p>
          </div>
        </div>
      </div>
    </section>
  );
}
