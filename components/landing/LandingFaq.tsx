/* ============================================================
   LANDING FAQ (Server Component)
   ------------------------------------------------------------
   • Receives the FAQ list via PROPS.
   • DaisyUI: uses the `collapse` component (checkbox-based
     accordion) so the open/close behavior works WITHOUT any
     custom JavaScript — that is the DaisyUI replacement for the
     reference HTML's toggleFaq() script.
   ============================================================ */

export type LandingFaq = {
  question: string;
  answer: string;
};

type LandingFaqProps = {
  titleTop: string;
  titleBottom: string;
  intro: string;
  faqs: LandingFaq[];
};

export default function LandingFaq({
  titleTop,
  titleBottom,
  intro,
  faqs,
}: LandingFaqProps) {
  return (
    <section id="faq" className="bg-white py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-[0.7fr_1.3fr]">
        {/* Left column: heading */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-dwellix-500">
            FAQs
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            {titleTop}
            <br />
            {titleBottom}
          </h2>
          <p className="mt-5 max-w-xs text-sm leading-7 text-gray-500">{intro}</p>
        </div>

        {/* Right column: DaisyUI collapse accordion (one per question) */}
        <div>
          {faqs.map((faq) => (
            <div
              key={faq.question}
              className="collapse collapse-arrow border-b border-base-300"
            >
              {/* The hidden checkbox is what DaisyUI uses to toggle the panel */}
              <input type="checkbox" />
              <div className="collapse-title py-5 text-sm font-semibold">
                {faq.question}
              </div>
              <div className="collapse-content text-xs leading-6 text-gray-500">
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
