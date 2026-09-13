/* ============================================================
   LANDING FOOTER (Server Component)
   ------------------------------------------------------------
   • Presentational Server Component — all texts arrive via PROPS.
   • Visual design follows dwellix_landing_page_v4.html: dark
     footer, link columns, giant orange "Dwellix" wordmark.
   ============================================================ */

type LandingFooterProps = {
  brand: string;
  tagline: string;
  accessTitle: string;
  accessLinks: { label: string; href: string }[];
  supportTitle: string;
  supportEmail: string;
  copyright: string;
  wordmark: string;
};

export default function LandingFooter({
  brand,
  tagline,
  accessTitle,
  accessLinks,
  supportTitle,
  supportEmail,
  copyright,
  wordmark,
}: LandingFooterProps) {
  return (
    <footer className="bg-[#252524] pb-8 pt-16 text-gray-400">
      <div className="mx-auto max-w-6xl px-6">
        {/* Top grid: brand + link columns */}
        <div className="grid gap-10 border-b border-white/10 pb-12 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-dwellix-500 font-bold text-white">
                D
              </span>
              <span className="text-xl font-bold text-white">{brand}</span>
            </div>
            <p className="mt-4 max-w-sm text-[11px] leading-6">{tagline}</p>
          </div>

          {/* Access links (props-driven list) */}
          <div>
            <h3 className="mb-4 text-base font-bold text-white">{accessTitle}</h3>
            <ul className="space-y-2 text-[11px]">
              {accessLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="hover:text-white">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support column */}
          <div>
            <h3 className="mb-4 text-base font-bold text-white">{supportTitle}</h3>
            <ul className="space-y-2 text-[11px]">
              <li>
                <a href={`mailto:${supportEmail}`} className="hover:text-white">
                  {supportEmail}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Giant orange wordmark like the reference */}
        <p className="select-none py-10 text-center text-[18vw] font-bold leading-none tracking-tight text-dwellix-500 md:text-[150px]">
          {wordmark}
        </p>

        {/* Bottom bar */}
        <div className="flex flex-col gap-2 text-[10px] md:flex-row md:justify-between">
          <p>{copyright}</p>
          <p>Built for better property operations.</p>
        </div>
      </div>
    </footer>
  );
}
