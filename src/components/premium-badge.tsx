import { Badge } from "@/components/ui/badge";

/** "Free", "Premium", or "Unlocked" once this event has paid for it. Prices are shown only in the unlock dialog. */
export function PremiumBadge({ isPremium, unlocked = false, className }: { isPremium: boolean; unlocked?: boolean; className?: string }) {
  if (!isPremium) return <Badge variant="secondary" className={className}>Free</Badge>;
  return unlocked ? <Badge variant="secondary" className={className}>Unlocked</Badge> : <Badge variant="outline" className={className}>Premium</Badge>;
}
