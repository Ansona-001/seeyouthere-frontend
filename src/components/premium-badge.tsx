import { Badge } from "@/components/ui/badge";

/** "Premium", or "Unlocked" once this event has paid for it. Prices are shown only in the unlock dialog. Renders nothing for free designs. */
export function PremiumBadge({ isPremium, unlocked = false }: { isPremium: boolean; unlocked?: boolean }) {
  if (!isPremium) return null;
  return unlocked ? <Badge variant="secondary">Unlocked</Badge> : <Badge variant="outline">Premium</Badge>;
}
