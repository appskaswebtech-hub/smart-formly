import type { ReactNode } from "react";

import HeroArt, { type ArtVariant } from "./HeroArt";
import { C, RADIUS } from "./theme";

/**
 * The banner that opens every tab.
 *
 * Layout is CSS-grid with a named class so `app/styles/admin.css` can collapse
 * it on tablet and phone: the artwork is decorative, so below 1024px it is
 * hidden outright rather than squeezed into an unreadable sliver.
 */
export type HeroProps = {
  /** Small uppercase label above the title. The dashboard omits it. */
  eyebrow?: string;
  /** Leading, near-black part of the heading. */
  title: string;
  /** Trailing part, rendered in green. */
  titleAccent?: string;
  /** One or two short lines. */
  subtitle?: ReactNode;
  /** Buttons rendered under the subtitle. */
  actions?: ReactNode;
  /** Which illustration to draw. */
  art?: ArtVariant;
};

export function Hero({ eyebrow, title, titleAccent, subtitle, actions, art = "forms" }: HeroProps) {
  return (
    <section
      className="sf-hero"
      style={{
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(110deg, ${C.mint} 0%, ${C.wash} 55%, ${C.soft} 100%)`,
        border: `1px solid ${C.line}`,
        borderRadius: RADIUS.hero,
        padding: "34px 40px",
      }}
    >
      <div className="sf-hero__grid">
        <div className="sf-hero__copy">
          {eyebrow && (
            <p
              style={{
                margin: "0 0 10px",
                fontSize: 11.5,
                fontWeight: 700,
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                color: C.mid,
              }}
            >
              {eyebrow}
            </p>
          )}

          <h1
            className="sf-hero__title"
            style={{ margin: 0, color: C.ink, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.12 }}
          >
            {title}
            {titleAccent && <span style={{ color: C.mid }}> {titleAccent}</span>}
          </h1>

          {subtitle && (
            <p
              className="sf-hero__subtitle"
              style={{ margin: "14px 0 0", color: C.body, lineHeight: 1.6, maxWidth: 520 }}
            >
              {subtitle}
            </p>
          )}

          {actions && (
            <div className="sf-hero__actions" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24 }}>
              {actions}
            </div>
          )}
        </div>

        <div className="sf-hero__art" aria-hidden="true">
          <HeroArt variant={art} />
        </div>
      </div>
    </section>
  );
}

export default Hero;
