import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export default function DashboardPage() {
  return (
    <>
      <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Ringkasan dan statistik akan ditampilkan di sini.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Devices</CardTitle>
          </CardHeader>
          <CardContent>Total session terhubung: —</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Contacts</CardTitle>
          </CardHeader>
          <CardContent>Total kontak: —</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Broadcast</CardTitle>
          </CardHeader>
          <CardContent>Pesan terkirim hari ini: —</CardContent>
        </Card>
      </div>
    </>
  );
}
