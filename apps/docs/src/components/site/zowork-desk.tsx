import Image from "next/image";
import { ArrowRight } from "lucide-react";

/**
 * Zowork, on the Pro page.
 *
 * The Pro page ends at "Coming soon", which leaves a reader who wants the
 * thing now with nowhere to go. This is where they go: the team that wrote
 * these components also builds the applications they sit inside.
 *
 * That is not a sponsorship. Component Library and Design Systems are two of
 * the five entries on Zowork's own platform list — ZoBlocks is one of the
 * things Zowork makes, and saying so is the whole argument of the section.
 *
 * ## The plate follows the theme
 *
 * It was dark under both at first, on the argument that a guest brand needs an
 * edge. That is the same mistake the stage above it already made and already
 * paid for — a light reader gets a dark slab between a light header and a light
 * footer, and the high-contrast reader, who asked for maximum contrast, is the
 * only one who does not get it. Every colour now comes from a site token, and
 * the edge is carried by the ground shift and the accent hairline instead.
 *
 * ## The accent is ours; the logo is Zowork's
 *
 * Zowork's brand colour is a coral, `#ff667d`, and nothing in the UI uses it.
 * Two accent hues inside one panel read as a mistake rather than as two
 * companies. The mark is the exception, because a logo recoloured to suit its
 * host is no longer the logo: their coral original shows on light grounds and
 * their white one on dark.
 *
 * ## Facts
 *
 * Everything stated below is from zowork.com, checked on 8 September 2026. If
 * a number here stops matching their site, this component is wrong and the
 * fix is to change it, not to soften it into a claim that cannot be checked.
 */

/** Verified against zowork.com. Each is a fact, not a positioning line. */
const PROOF: { value: string; label: string }[] = [
  { value: "10 yrs", label: "In behavioral health" },
  { value: "Bells.ai", label: "Built it. Netsmart bought it." },
  { value: "~50%", label: "Documentation time returned" },
  { value: "Zero", label: "Clients lost to churn" },
];

/** Written the way Zowork's own footer writes them: code above, city below. */
const OFFICES: { code: string; city: string }[] = [
  { code: "BLR", city: "Bangalore" },
  { code: "AMD", city: "Ahmedabad" },
  { code: "YOK", city: "Yokohama" },
  { code: "WIL", city: "Wilmington" },
];

const PHONES: { region: string; label: string; href: string }[] = [
  { region: "US", label: "+1 302 600 3184", href: "tel:+13026003184" },
  { region: "Japan", label: "+81 80 1444 1599", href: "tel:+818014441599" },
  { region: "India", label: "+91 80166 89265", href: "tel:+918016689265" },
];

/**
 * `rel="noopener"` on every outbound link, and `me` on none of them: these are
 * Zowork's accounts, not this site's, so claiming them as identity would be
 * false. `aria-label` carries the network name because the glyph alone says
 * nothing to a screen reader.
 */
const SOCIAL: { name: string; href: string; path: string }[] = [
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/zowork",
    path: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.76-2.05C20.5 8.65 22 11 22 14.5V21h-4v-5.8c0-1.4-.03-3.2-2-3.2-2 0-2.3 1.5-2.3 3.1V21H9z",
  },
  {
    name: "X",
    href: "https://x.com/zoworkhq",
    path: "M18.24 2H21l-6.55 7.5L22.5 22h-6.3l-4.9-6.4L5.6 22H3l7.05-8L1.9 2h6.45l4.42 5.85L18.24 2zm-1.1 18h1.7L7.02 3.8H5.2z",
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/zowork_",
    path: "M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.42.56.22.96.48 1.38.9.42.42.68.82.9 1.38.17.42.37 1.06.42 2.23.06 1.25.07 1.63.07 4.8s0 3.55-.07 4.8c-.05 1.17-.25 1.8-.42 2.23a3.8 3.8 0 0 1-.9 1.38c-.42.42-.82.68-1.38.9-.42.17-1.06.37-2.23.42-1.25.06-1.63.07-4.85.07s-3.6 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.42a3.8 3.8 0 0 1-1.38-.9 3.8 3.8 0 0 1-.9-1.38c-.17-.42-.37-1.06-.42-2.23C2.2 15.55 2.2 15.17 2.2 12s0-3.55.07-4.8c.05-1.17.25-1.8.42-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.17 1.06-.37 2.23-.42C8.45 2.2 8.83 2.2 12 2.2zm0 3.05A6.75 6.75 0 1 0 18.75 12 6.75 6.75 0 0 0 12 5.25zm0 11.13A4.38 4.38 0 1 1 16.38 12 4.38 4.38 0 0 1 12 16.38zm6.99-11.4a1.58 1.58 0 1 1-1.58-1.57 1.58 1.58 0 0 1 1.58 1.58z",
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/@zowork",
    path: "M23 12s0-3.3-.42-4.88a2.53 2.53 0 0 0-1.78-1.79C19.22 4.9 12 4.9 12 4.9s-7.22 0-8.8.43a2.53 2.53 0 0 0-1.78 1.8C1 8.7 1 12 1 12s0 3.3.42 4.88a2.53 2.53 0 0 0 1.79 1.79c1.57.43 8.79.43 8.79.43s7.22 0 8.8-.43a2.53 2.53 0 0 0 1.78-1.79C23 15.3 23 12 23 12zM9.7 15.4V8.6l6.02 3.4z",
  },
];

const ENQUIRY_HREF =
  "mailto:hello@zowork.com?subject=" + encodeURIComponent("Custom build enquiry from ZoBlocks");

export function ZoworkDesk() {
  return (
    /*
      `aria-labelledby` rather than `aria-label`: the heading is already the
      name of this region, and a second string would make a screen reader
      announce two.
    */
    <section className="zwDesk" aria-labelledby="zw-desk-head">
      <div className="zwDeskSay">
        {/*
          One mark, black on light and white on dark.

          Zowork publish two files, `zowork.png` and `zowork-colour.png`, and
          this used to ship both: the coral original on light grounds and the
          white one on dark. Rahul asked for black on 10 Sep 2026, and the
          coral was the loudest thing on the plate — a second accent hue inside
          a panel that is otherwise entirely ZoBlocks green.

          Black comes from the file Zowork already publish rather than from a
          new asset. `zowork.png` is a one-colour mark: every opaque pixel in
          it is pure white, on transparency, which was measured rather than
          assumed. `invert(1)` therefore turns it into pure black and leaves
          the alpha alone. That is the other half of a monochrome mark, not a
          recolour — there is no hue to lose. If Zowork ever publish a black
          file, swap it in here and drop the filter.

          `next/image` rather than a bare `img`: `no-img-element` is a warning
          and `pnpm lint` runs at exactly its ceiling, so one bare tag fails the
          build. `unoptimized` because this is a 2 KB PNG already at its
          display size — the optimiser would cost a round trip to save nothing.

          `zwDeskLogoImg` pins the box. As a flex item in a column the default
          `align-items: stretch` overrides `width: auto` and renders the mark at
          full column width with the height still fixed, which is not a subtle
          distortion.
        */}
        <Image
          src="/brand/zowork.png"
          alt="Zowork"
          width={202}
          height={52}
          className="zwDeskLogoImg"
          unoptimized
        />

        <p className="eyebrow zwDeskEyebrow">Custom application development</p>

        <h2 id="zw-desk-head" className="zwDeskHead">
          The components are free. <em>The decade behind them</em> is available too.
        </h2>

        <p className="zwDeskLede">
          <b>Zowork</b> is the engineering and design team that built ZoBlocks — and the clinical
          platforms thousands of clinicians open every morning. Behavioral health since 2016,
          without a pivot. HIPAA and SOC 2 for the whole of it.
        </p>

        <dl className="zwDeskProof">
          {PROOF.map(({ value, label }) => (
            <div key={value}>
              <dt className="zwDeskProofV">{value}</dt>
              <dd className="zwDeskProofL">{label}</dd>
            </div>
          ))}
        </dl>

        <div className="zwDeskActions">
          <a className="zwDeskCta" href="https://www.zowork.com/" rel="noopener">
            Book a consultation
          </a>
          <a className="zwDeskGhost" href="https://www.zowork.com/case-studies/" rel="noopener">
            Case studies
            <ArrowRight aria-hidden="true" className="size-4" />
          </a>
        </div>
      </div>

      <div className="zwDeskCard">
        {/*
          Zowork's own promise, in their words. The dot is decorative — the
          sentence carries the whole meaning, so nothing is lost with motion
          reduced or with the animation unsupported.
        */}
        <p className="zwDeskLive">
          <i className="zwDeskDot" aria-hidden="true" />
          Our team replies. Usually inside a business day.
        </p>

        <div className="zwDeskField">
          <span className="zwDeskK">Email</span>
          <span className="zwDeskV">
            <a href={ENQUIRY_HREF}>hello@zowork.com</a>
          </span>
        </div>

        <div className="zwDeskField">
          <span className="zwDeskK">Phone</span>
          <span className="zwDeskV zwDeskTri">
            {PHONES.map(({ region, label, href }) => (
              <span key={region}>
                <span className="zwDeskTriK">{region}</span>
                <a href={href}>{label}</a>
              </span>
            ))}
          </span>
        </div>

        <div className="zwDeskField">
          <span className="zwDeskK">Offices</span>
          <span className="zwDeskV zwDeskCities">
            {OFFICES.map(({ code, city }) => (
              <span key={code}>
                <span className="zwDeskCityCode">{code}</span>
                <span className="zwDeskCityName">{city}</span>
              </span>
            ))}
          </span>
        </div>

        <div className="zwDeskField">
          <span className="zwDeskK">On the web</span>
          <span className="zwDeskV">
            <a href="https://www.zowork.com/" rel="noopener">
              zowork.com
            </a>
          </span>
        </div>

        <ul className="zwDeskSocial">
          {SOCIAL.map(({ name, href, path }) => (
            <li key={name}>
              <a href={href} rel="noopener" aria-label={`Zowork on ${name}`}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d={path} />
                </svg>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
