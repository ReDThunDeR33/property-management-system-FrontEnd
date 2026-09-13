/* ============================================================
   LANDING ROLES (Server Component)
   ------------------------------------------------------------
   • Presentational Server Component — roles data arrives via
     PROPS and is rendered with the .map() list pattern.
   • Visual design follows dwellix_landing_page_v4.html:
     dark section (#242423), four role cards with "→" bullet
     lists and a decorative orange circle in the corner.
   ============================================================ */

export type LandingRole = {
  number: string;
  name: string;
  copy: string;
  points: string[];
};

type LandingRolesProps = {
  titleTop: string;
  titleBottom: string;
  intro: string;
  roles: LandingRole[];
};

export default function LandingRoles({
  titleTop,
  titleBottom,
  intro,
  roles,
}: LandingRolesProps) {
  return (
    <section id="roles" className="bg-[#242423] py-20 text-white md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section heading */}
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 className="text-4xl font-bold tracking-tight md:text-6xl">
            {titleTop}
            <br />
            {titleBottom}
          </h2>
          <p className="max-w-md text-sm leading-7 text-gray-400">{intro}</p>
        </div>

        {/* Role cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map((role) => (
            <div
              key={role.name}
              className="relative min-h-72 overflow-hidden border border-[#3d3d3a] bg-[#30302e] p-7 transition-transform hover:-translate-y-1.5 hover:border-dwellix-500"
            >
              <p className="text-xs tracking-widest text-gray-400">{role.number}</p>

              <h3 className="mt-14 text-2xl font-bold">{role.name}</h3>
              <p className="mt-3 text-xs leading-6 text-gray-400">{role.copy}</p>

              {/* "→" bullets like the reference */}
              <ul className="mt-5 space-y-1.5 text-[11px] leading-6 text-gray-300">
                {role.points.map((point) => (
                  <li key={point}>
                    <span className="mr-2 text-dwellix-500">→</span>
                    {point}
                  </li>
                ))}
              </ul>

              {/* Decorative double circle in the corner */}
              <div className="pointer-events-none absolute -bottom-8 -right-6 h-24 w-24 rounded-full border border-dwellix-500/40" />
              <div className="pointer-events-none absolute bottom-[-2px] right-[-8px] h-24 w-24 rounded-full border border-dwellix-500/20" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
