// The scamdb logo: an anglerfish dangling a pink lure, the bait that hides the trap. Drawn by hand at build time
// (lib/sketch.js), with a fixed seed so every build is identical.
import { sketch } from '../../lib/sketch.js';

const draw = () => {
  const s = sketch(1121);
  return s.path('M6 34 C 6 18, 24 12, 38 18 C 46 22, 50 30, 46 38 C 40 48, 20 50, 10 44 L 2 50 L 4 38 Z', { fill: 'card', shade: true })
    + s.path('M44 34 C 40 36, 34 36, 30 34 M33 34 l2 4 l2 -4 l2 4') + s.circle(32, 25, 4)
    + s.path('M30 16 C 34 4, 48 2, 52 12', { kind: 'thin' }) + s.circle(52, 15, 7, { kind: 'acc' });
};

/** The header logo (styled by the site's sketch classes). */
export const LOGO = `<svg viewBox="0 0 60 60" aria-hidden="true" focusable="false">${draw()}</svg>`;

/** The favicon: the same drawing on a rounded tile, with its own colours and heavier lines so it reads at 16px. */
export const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><style>
.t{fill:#eceee4}.sk,.sk-thin,.sk-acc{fill:none;stroke-linecap:round;stroke-linejoin:round}.sk{stroke:#1d2a20;stroke-width:3.4}.sk-thin{stroke:#1d2a20;stroke-width:2.6}
.sk-acc{stroke:#d63d74;stroke-width:4.4}.sk-shade{display:none}.sk-fill-card{fill:#fafbf6}
@media (prefers-color-scheme:dark){.t{fill:#1b241d}.sk,.sk-thin{stroke:#e7ebde}.sk-acc{stroke:#ff6f9f}.sk-fill-card{fill:#131a15}}
</style><rect class="t" width="64" height="64" rx="14"/><g transform="translate(3 4)">${draw()}</g></svg>`;
