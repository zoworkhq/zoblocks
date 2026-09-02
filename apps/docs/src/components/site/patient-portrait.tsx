import Image from "next/image";

/**
 * A patient's portrait, in a demo.
 *
 * One component for the three surfaces that show one — the home page, the
 * catalogue card and the state browser — because a portrait in a clinical UI
 * carries decisions, and three copies of it would carry three different ones.
 *
 * `alt=""`. The name is beside it in text on every surface that uses this, and
 * "photograph of Adeyemi, R." announced before each of six rows is noise a
 * screen-reader user has no way to skip. A portrait that were the *only*
 * identification of a row would need a real alt; none of ours is.
 *
 * Served from `/fixtures/patients/`, which is this site's own origin. That is
 * not incidental: `packages/identity` states the rule that a patient
 * photograph must not be proxied through a third-party image CDN, and it holds
 * for a demo too — the faces below are generated, of nobody, and they still do
 * not leave the origin serving them.
 *
 * What this deliberately does not do is model the absence of a photograph.
 * "No photo on file", "the photo failed to load" and "withheld by policy" are
 * three different facts and rendering them identically is a silently degraded
 * safety control; `PatientChip` in `@oxygenui-design/identity` distinguishes
 * five of them. This is a demo cell, and it says so here rather than pretending
 * to be the answer.
 */
export function PatientPortrait({ src, size = 22 }: { src: string; size?: number }) {
  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      /* `max-w-none`: preflight caps every `img` at `max-width: 100%`, so a
         fixed-size portrait collapses to nothing inside a container narrower
         than itself — a fit-to-width block frame, a flex row mid-layout. The
         inline width below is the size, and nothing should be allowed to
         reinterpret it as a maximum. */
      className="max-w-none flex-none rounded-full object-cover ring-1 ring-black/15"
      style={{ width: size, height: size }}
    />
  );
}
