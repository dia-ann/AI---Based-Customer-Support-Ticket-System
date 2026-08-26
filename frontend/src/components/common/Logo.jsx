/**
 * The Deskwise mark: a headset wrapping a speech-bubble with a sparkle
 * inside it, plus a small twinkle accent — matches the reference brand art.
 */
export default function Logo({ size = 56, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Headset arc */}
      <path
        d="M22 46V40C22 22.3 34.8 9 50 9C65.2 9 78 22.3 78 40V46"
        stroke="white"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      {/* Left ear cup */}
      <rect x="14" y="42" width="16" height="24" rx="8" stroke="white" strokeWidth="5.5" />
      {/* Right ear cup */}
      <rect x="70" y="42" width="16" height="24" rx="8" stroke="white" strokeWidth="5.5" />
      {/* Mic boom from right ear cup curling toward the speech bubble */}
      <path
        d="M78 66C78 76 70 80 62 80H55"
        stroke="white"
        strokeWidth="5.5"
        strokeLinecap="round"
      />

      {/* Speech bubble */}
      <rect x="28" y="46" width="46" height="34" rx="12" className="fill-accent" />
      {/* Bubble tail */}
      <path d="M40 78L34 90L50 80Z" className="fill-accent" />

      {/* Sparkle inside the bubble */}
      <path
        d="M51 55L54 61L60 64L54 67L51 73L48 67L42 64L48 61Z"
        fill="white"
      />
      {/* Small twinkle accent outside the bubble */}
      <path d="M80 32L81.5 35.5L85 37L81.5 38.5L80 42L78.5 38.5L75 37L78.5 35.5Z" className="fill-accent" />
    </svg>
  );
}
