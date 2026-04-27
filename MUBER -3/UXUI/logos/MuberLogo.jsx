/**
 * MuberLogo — Componente React
 * Logo oficial de MUBER en SVG inline.
 * 
 * Props:
 *   variant  "light" | "dark" | "amber"   (default: "light")
 *   size     "sm" | "md" | "lg" | "xl"    (default: "md")
 *   showTag  boolean                       (default: true)
 *   className string                       (default: "")
 * 
 * Uso:
 *   <MuberLogo />
 *   <MuberLogo variant="dark" size="lg" />
 *   <MuberLogo variant="amber" showTag={false} />
 */

const SIZES = {
  sm:  { width: 160, height:  40 },
  md:  { width: 320, height:  80 },
  lg:  { width: 480, height: 120 },
  xl:  { width: 640, height: 160 },
};

const TOKENS = {
  light: {
    bg:        "#FFFFFF",
    bgStroke:  "#E5E5E5",
    iconBg:    "#0A0A0A",
    bar1:      "#F5A800",
    bar2:      "rgba(255,255,255,0.45)",
    arrow:     "#F5A800",
    mu:        "#0A0A0A",
    ber:       "#F5A800",
    tag:       "rgba(10,10,10,0.38)",
  },
  dark: {
    bg:        "#0A0A0A",
    bgStroke:  "none",
    iconBg:    "#F5A800",
    bar1:      "#0A0A0A",
    bar2:      "rgba(10,10,10,0.38)",
    arrow:     "#0A0A0A",
    mu:        "#FFFFFF",
    ber:       "#F5A800",
    tag:       "rgba(255,255,255,0.32)",
  },
  amber: {
    bg:        "#F5A800",
    bgStroke:  "none",
    iconBg:    "#0A0A0A",
    bar1:      "#F5A800",
    bar2:      "rgba(255,255,255,0.40)",
    arrow:     "#F5A800",
    mu:        "#0A0A0A",
    ber:       "#FFFFFF",
    tag:       "rgba(10,10,10,0.42)",
  },
};

export default function MuberLogo({
  variant  = "light",
  size     = "md",
  showTag  = true,
  className = "",
}) {
  const t = TOKENS[variant] || TOKENS.light;
  const { width, height } = SIZES[size] || SIZES.md;

  /* El diseño base es 480×120; escalamos con viewBox */
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 480 120"
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label="Muber — Logística y Mudanzas"
    >
      {/* Fondo con esquinas redondeadas */}
      <rect
        width="480" height="120" rx="16"
        fill={t.bg}
        stroke={t.bgStroke}
        strokeWidth={t.bgStroke === "none" ? 0 : 1}
      />

      {/* ── Ícono ── */}
      {/* Caja del ícono */}
      <rect x="16" y="16" width="80" height="88" rx="16" fill={t.iconBg} />

      {/* Barra superior */}
      <rect x="27" y="34" width="44" height="11" rx="5.5" fill={t.bar1} />

      {/* Barra inferior (semitransparente) */}
      <rect x="27" y="50" width="29" height="11" rx="5.5" fill={t.bar2} />

      {/* Chevron */}
      <polyline
        points="80,28 96,60 80,92"
        stroke={t.arrow}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* ── Wordmark ── */}
      <text
        x="112" y="88"
        fontFamily="'Barlow Condensed', 'Arial Narrow', Arial, sans-serif"
        fontWeight="800"
        fontSize="72"
        letterSpacing="-1"
        fill={t.mu}
      >
        MU
      </text>
      <text
        x="251" y="88"
        fontFamily="'Barlow Condensed', 'Arial Narrow', Arial, sans-serif"
        fontWeight="800"
        fontSize="72"
        letterSpacing="-1"
        fill={t.ber}
      >
        BER
      </text>

      {/* ── Tagline ── */}
      {showTag && (
        <text
          x="113" y="108"
          fontFamily="'Barlow', Arial, sans-serif"
          fontWeight="600"
          fontSize="10"
          letterSpacing="3"
          fill={t.tag}
        >
          SU MUDANZA, SIN ESTRES
        </text>
      )}
    </svg>
  );
}

/* ── Variantes de conveniencia ─────────────────────────── */
export const MuberLogoLight = (props) => <MuberLogo variant="light" {...props} />;
export const MuberLogoDark  = (props) => <MuberLogo variant="dark"  {...props} />;
export const MuberLogoAmber = (props) => <MuberLogo variant="amber" {...props} />;
