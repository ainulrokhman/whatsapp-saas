import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";

export default function DevicesPage() {
  return (
    <>
      <h1 className="text-xl font-semibold text-foreground">Devices</h1>
      <p className="mt-2 text-muted-foreground">
        Daftar session WhatsApp per tenant akan ditampilkan di sini.
      </p>
      <div className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Terakhir aktif</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                Belum ada device. Tambah session untuk memulai.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </>
  );
}
