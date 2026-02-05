"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useHasPermission } from "@/components/providers/PermissionsProvider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Contact } from "@prisma/client";
import {
  createContact,
  updateContact,
  deleteContact,
} from "@/app/(admin)/actions/contact-actions";

export function ContactsPageContent({ contacts }: { contacts: Contact[] }) {
  const router = useRouter();
  const canCreate = useHasPermission("contact:create");
  const canUpdate = useHasPermission("contact:update");
  const canDelete = useHasPermission("contact:delete");
  const [tagFilter, setTagFilter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formPhone, setFormPhone] = useState("");
  const [formName, setFormName] = useState("");
  const [formTag, setFormTag] = useState("");
  const [pending, setPending] = useState(false);

  const filtered =
    tagFilter.trim() === ""
      ? contacts
      : contacts.filter((c) => c.tag?.toLowerCase() === tagFilter.trim().toLowerCase());

  const tags = [...new Set(contacts.map((c) => c.tag).filter(Boolean))] as string[];

  function refresh() {
    router.refresh();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const formData = new FormData();
    formData.set("phone", formPhone);
    formData.set("name", formName);
    formData.set("tag", formTag);
    const result = await createContact(formData);
    setPending(false);
    if (result.ok) {
      setFormPhone("");
      setFormName("");
      setFormTag("");
      refresh();
    } else {
      alert(result.error);
    }
  }

  async function handleUpdate(e: React.FormEvent, contactId: string) {
    e.preventDefault();
    setPending(true);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const result = await updateContact(contactId, formData);
    setPending(false);
    if (result.ok) {
      setEditingId(null);
      refresh();
    } else {
      alert(result.error);
    }
  }

  async function handleDelete(contactId: string) {
    if (!confirm("Hapus kontak ini?")) return;
    setDeletingId(contactId);
    const result = await deleteContact(contactId);
    setDeletingId(null);
    if (result.ok) refresh();
    else alert(result.error);
  }

  return (
    <>
      <h1 className="text-xl font-semibold text-foreground">Contacts</h1>
      <p className="mt-2 text-muted-foreground">
        Kelola kontak untuk broadcast. Filter berdasarkan tag opsional.
      </p>

      {canCreate && (
      <form onSubmit={handleCreate} className="mt-6 flex flex-wrap items-end gap-4">
        <div className="min-w-[140px]">
          <label className="mb-1 block text-sm font-medium text-foreground">Nomor</label>
          <Input
            value={formPhone}
            onChange={(e) => setFormPhone(e.target.value)}
            placeholder="+6281234567890"
            required
            disabled={pending}
          />
        </div>
        <div className="min-w-[140px]">
          <label className="mb-1 block text-sm font-medium text-foreground">Nama</label>
          <Input
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Nama"
            disabled={pending}
          />
        </div>
        <div className="min-w-[100px]">
          <label className="mb-1 block text-sm font-medium text-foreground">Tag</label>
          <Input
            value={formTag}
            onChange={(e) => setFormTag(e.target.value)}
            placeholder="Tag"
            disabled={pending}
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Menambah…" : "Tambah kontak"}
        </Button>
      </form>
      )}

      {tags.length > 0 && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter tag:</span>
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="rounded-md border border-header-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Semua</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nomor</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Tag</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Belum ada kontak.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id}>
                  {editingId === c.id ? (
                    <>
                      <TableCell colSpan={4}>
                        <form
                          onSubmit={(e) => handleUpdate(e, c.id)}
                          className="flex flex-wrap items-center gap-4"
                        >
                          <Input
                            name="phone"
                            defaultValue={c.phone}
                            required
                            className="w-40"
                          />
                          <Input name="name" defaultValue={c.name ?? ""} className="w-40" />
                          <Input name="tag" defaultValue={c.tag ?? ""} className="w-24" />
                          <Button type="submit" size="sm" disabled={pending}>
                            Simpan
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setEditingId(null)}
                          >
                            Batal
                          </Button>
                        </form>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-medium">{c.phone}</TableCell>
                      <TableCell className="text-muted-foreground">{c.name ?? "–"}</TableCell>
                      <TableCell className="text-muted-foreground">{c.tag ?? "–"}</TableCell>
                      <TableCell className="text-right">
                        {canUpdate && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="mr-2"
                            onClick={() => setEditingId(c.id)}
                          >
                            Edit
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={deletingId === c.id}
                            onClick={() => handleDelete(c.id)}
                          >
                            {deletingId === c.id ? "Menghapus…" : "Hapus"}
                          </Button>
                        )}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
