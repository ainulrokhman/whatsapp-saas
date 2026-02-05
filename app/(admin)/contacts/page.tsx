import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";

export default function ContactsPage() {
  return (
    <>
      <h1 className="text-xl font-semibold text-foreground">Contacts</h1>
      <p className="mt-2 text-muted-foreground">
        Daftar kontak per tenant akan ditampilkan di sini.
      </p>
      <div className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nomor</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Tag</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                Belum ada kontak. Import atau tambah kontak untuk memulai.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </>
  );
}
