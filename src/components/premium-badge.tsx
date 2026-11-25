import { Badge } from "@/components/ui/badge";

/**
 * "Free", the price (`price`, already formatted for the viewer's region) of a premium design, plain "Premium" when no
 * price is known, or "Unlocked" once this event has paid for it.
 */
export function PremiumBadge({
  isPremium,
  unlocked = false,
  price,
  className,
}: {
  isPremium: boolean;
  unlocked?: boolean;
  price?: string;
  className?: string;
}) {
  if (!isPremium) return <Badge variant="secondary" className={className}>Free</Badge>;
  if (unlocked) return <Badge variant="secondary" className={className}>Unlocked</Badge>;
  if (price) {
    return (
      <Badge variant="outline" className={className}>
        <span className="sr-only">Premium design, </span>
        {price}
      </Badge>
    );
  }
  return <Badge variant="outline" className={className}>Premium</Badge>;
}
