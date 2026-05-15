import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Search, Download } from "lucide-react";

const rows = [
  { id: "SC-2104", patient: "A-1093", user: "Dr. Reyes", result: "Glioma", conf: 94, date: "May 3, 2026" },
  { id: "SC-2103", patient: "A-1088", user: "Dr. Tan", result: "No Tumor", conf: 99, date: "May 1, 2026" },
  { id: "SC-2102", patient: "A-1071", user: "Dr. Reyes", result: "Meningioma", conf: 88, date: "Apr 28, 2026" },
  { id: "SC-2101", patient: "A-1065", user: "Dr. Tan", result: "Pituitary", conf: 91, date: "Apr 22, 2026" },
  { id: "SC-2100", patient: "A-1041", user: "S. Khan", result: "No Tumor", conf: 97, date: "Apr 15, 2026" },
  { id: "SC-2099", patient: "A-1032", user: "Dr. Reyes", result: "Glioma", conf: 89, date: "Apr 11, 2026" },
];

const tone = (r: string) =>
  r === "No Tumor" ? "bg-success/15 text-success"
  : r === "Glioma" ? "bg-destructive/15 text-destructive"
  : "bg-warning/15 text-warning";

export default function Classifications() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Classifications</h1>
          <p className="text-sm text-muted-foreground">All MRI predictions made on the platform.</p>
        </div>
        <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 pb-4">
          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by scan ID, patient, user…" />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              <SelectItem value="g">Glioma</SelectItem>
              <SelectItem value="m">Meningioma</SelectItem>
              <SelectItem value="p">Pituitary</SelectItem>
              <SelectItem value="n">No Tumor</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="30">
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Scan ID</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Uploaded by</TableHead>
              <TableHead>Result</TableHead>
              <TableHead className="text-right">Confidence</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.id}</TableCell>
                <TableCell>#{r.patient}</TableCell>
                <TableCell>{r.user}</TableCell>
                <TableCell><Badge className={tone(r.result)}>{r.result}</Badge></TableCell>
                <TableCell className="text-right tabular-nums">{r.conf}%</TableCell>
                <TableCell className="text-muted-foreground">{r.date}</TableCell>
                <TableCell><Button size="icon" variant="ghost"><Eye className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
