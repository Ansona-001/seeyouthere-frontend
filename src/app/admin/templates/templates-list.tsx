import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminTemplate } from "@/lib/api-types";
import { formatMoney } from "@/lib/premium";

/** "₹599 · AED 29 · $9": only the regions offered. */
function priceSummary(t: AdminTemplate): string {
  const parts = [formatMoney("INR", t.price_paise)];
  if (t.regional_prices?.AE != null) parts.push(formatMoney("AED", t.regional_prices.AE));
  if (t.regional_prices?.INT != null) parts.push(formatMoney("USD", t.regional_prices.INT));
  return parts.join(" · ");
}

export function TemplatesList({ templates }: { templates: AdminTemplate[] }) {
  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Occasions</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Latest version</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {templates.map((t) => (
          <TableRow key={t.id}>
            <TableCell>
              <Link href={`/admin/templates/${t.id}`} className="font-medium hover:underline">
                {t.name}
              </Link>
              {t.is_premium && <Badge variant="secondary" className="ml-1.5">Premium</Badge>}
            </TableCell>
            <TableCell className="text-muted-foreground">{t.slug}</TableCell>
            <TableCell className="text-muted-foreground">{t.tags.occasions?.join(", ") || "all"}</TableCell>
            <TableCell className="text-muted-foreground">{t.is_premium ? priceSummary(t) : "Free"}</TableCell>
            <TableCell>
              <Badge variant={t.status === "published" ? "secondary" : "outline"}>{t.status}</Badge>
            </TableCell>
            <TableCell>{t.latest_version}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
  );
}
