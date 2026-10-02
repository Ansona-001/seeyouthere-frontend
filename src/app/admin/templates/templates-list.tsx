import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminTemplate } from "@/lib/api-types";

export function TemplatesList({ templates }: { templates: AdminTemplate[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Occasions</TableHead>
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
            <TableCell>
              <Badge variant={t.status === "published" ? "secondary" : "outline"}>{t.status}</Badge>
            </TableCell>
            <TableCell>{t.latest_version}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
