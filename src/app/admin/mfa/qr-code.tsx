import qrcode from "qrcode-generator";

const QUIET_ZONE = 4;

/**
 * Renders `value` as an inline SVG QR code. Generated entirely in the browser:
 * the TOTP secret must never be sent to a third-party QR service.
 */
export function QrCode({ value, label }: { value: string; label: string }) {
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
      className="size-48 max-w-full rounded-lg"
    >
      <rect width={size} height={size} fill="#fff" />
      <path d={path} fill="#000" />
    </svg>
  );
}
