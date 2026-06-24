export default function Brand({ size = 'md' }) {
  const logoSize = size === 'lg' ? 32 : 22;
  const textSize = size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Kobie coral heart SVG logo mark */}
      <svg
        width={logoSize}
        height={logoSize}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M16 28C16 28 4 20.5 4 12.5C4 8.36 7.36 5 11.5 5C13.74 5 15.75 6.01 16 6.27C16.25 6.01 18.26 5 20.5 5C24.64 5 28 8.36 28 12.5C28 20.5 16 28 16 28Z"
          fill="#FD7F4F"
        />
      </svg>
      <span
        className={`font-display font-semibold tracking-tight ${textSize}`}
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        OneClick<span className="text-beacon font-normal opacity-80"> AlertPortal</span>
      </span>
    </div>
  );
}
