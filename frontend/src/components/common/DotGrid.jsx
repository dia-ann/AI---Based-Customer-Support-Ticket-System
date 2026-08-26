/**
 * The small dot-grid decoration seen in the corners of the brand panel.
 * Purely decorative — positioned by the parent via className (e.g.
 * "absolute top-6 left-6").
 */
export default function DotGrid({ className = "" }) {
  const rows = 3;
  const cols = 4;

  return (
    <div className={`grid grid-cols-4 gap-1.5 ${className}`}>
      {Array.from({ length: rows * cols }).map((_, i) => (
        <span key={i} className="h-1 w-1 rounded-full bg-gray-600/50" />
      ))}
    </div>
  );
}
