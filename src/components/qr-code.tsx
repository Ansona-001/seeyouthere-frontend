import qrcode from "qrcode-generator";

const QUIET_ZONE = 4;

/**
 * Renders `value` as an inline SVG QR code. Generated locally (never via a third-party QR service):
 * the TOTP secret and entry-pass tokens must not leave our origin. `className` sets the size.
 */
export function QrCode({ value, label, className = "size-48" }: { value: string; label: string; className?: string }) {
  const qr = qrcode(0, "M");
  qr.addData(value);
  qr.make();

  const count = qr.getModuleCount();
  const size = count + QUIET_ZONE * 2;
  let path = "";
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) path += `M${col + QUIET_ZONE} ${row + QUIET_ZONE}h1v1h-1z`;
    }
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
      className={`${className} max-w-full rounded-lg`}
    >
      <rect width={size} height={size} fill="#fff" />
      <path d={path} fill="#000" />
    </svg>
  );
}
