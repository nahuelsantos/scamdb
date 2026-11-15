// Build-time hand-drawn shapes (rough.js, no DOM). Output is plain SVG <path> strings with CSS classes,
// so colours follow the light/dark tokens and the page loads no script. Fixed seeds keep builds identical.
import rough from 'roughjs';

const gen = rough.generator();
const PEN = { roughness: 1.1, bowing: 1 };
const WIDTH = { ink: 1.8, thin: 1.3, acc: 2.4 };
const CLASS = { ink: 'sk', thin: 'sk-thin', acc: 'sk-acc' };
const SHADE = { fillStyle: 'hachure', hachureGap: 7, hachureAngle: -50, fillWeight: 0.6 };
const SHADE_OFFSET = 'translate(6 8)';

const round = (d) => d.replace(/-?\d+\.\d+/g, (n) => String(Math.round(Number(n) * 10) / 10));

function paths(drawable, cls, extra = '') {
  return gen.toPaths(drawable)
    .filter((p) => !/^(M\s*-?[\d.]+\s+-?[\d.]+\s*)+$/.test(p.d.trim()))
    .map((p) => `<path class="${cls}" d="${round(p.d)}"${extra}/>`).join('');
}

/** A sketcher whose every shape is reproducible: shape n uses seed + n. */
export function sketch(seed) {
  let n = 0;
  const next = () => seed + 1 + n++;
  const draw = (make, o = {}) => {
    const kind = o.kind ?? 'ink';
    let out = '';
    if (o.shade) out += `<g transform="${SHADE_OFFSET}">${paths(make({ ...PEN, ...SHADE, stroke: 'none', fill: 'F', seed: next() }), 'sk-shade')}</g>`;
    if (o.fill) out += paths(make({ ...PEN, stroke: 'none', fill: 'F', fillStyle: 'solid', seed: next() }), `sk-fill-${o.fill}`);
    const dash = o.dash ? ` stroke-dasharray="${o.dash.join(' ')}"` : '';
    const opts = { ...PEN, stroke: 'S', strokeWidth: WIDTH[kind], seed: next(), ...(o.dash ? { roughness: 0.6, disableMultiStroke: true } : {}) };
    out += paths(make(opts), CLASS[kind], dash);
    return out;
  };
  return {
    path: (d, o) => draw((opts) => gen.path(d, opts), o),
    circle: (cx, cy, diameter, o) => draw((opts) => gen.circle(cx, cy, diameter, opts), o),
    rect: (x, y, w, h, o) => draw((opts) => gen.rectangle(x, y, w, h, opts), o),
    line: (x1, y1, x2, y2, o) => draw((opts) => gen.line(x1, y1, x2, y2, opts), o),
  };
}

/** Rounded-rectangle path data, for phones and bubbles. */
export const roundRect = (x, y, w, h, r) =>
  `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`;
