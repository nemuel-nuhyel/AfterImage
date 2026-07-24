export function Atmosphere() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 surface-grid opacity-60" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,9,12,0.96),rgba(7,9,12,0.72)_32%,rgba(7,9,12,0.9)),radial-gradient(circle_at_82%_10%,rgba(94,231,220,0.10),transparent_30%)]" />
      <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,rgba(32,48,54,0.52),transparent)]" />
    </div>
  );
}
