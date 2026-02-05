import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function BroadcastPage() {
  return (
    <>
      <h1 className="text-xl font-semibold text-foreground">Broadcast</h1>
      <p className="mt-2 text-muted-foreground">
        Form kirim pesan broadcast akan ditampilkan di sini.
      </p>
      <Card className="mt-6 max-w-xl">
        <CardHeader>
          <CardTitle>Kirim pesan broadcast</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input label="Pesan" placeholder="Tulis pesan..." disabled />
          <Button disabled>Pilih kontak & kirim</Button>
        </CardContent>
      </Card>
    </>
  );
}
