"use client";

import { useEffect, useState } from "react";
import { KeyRound, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

interface Cashier {
  _id: string;
  username: string;
  role: string;
}

export function UsersTab() {
  const [users, setUsers] = useState<Cashier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // create/edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Cashier | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // reset password dialog
  const [pwUser, setPwUser] = useState<Cashier | null>(null);
  const [newPw, setNewPw] = useState("");

  const [deleteUser, setDeleteUser] = useState<Cashier | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setUsers(await apiFetch<Cashier[]>("/api/users"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در بارگذاری کاربران");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setUsername("");
    setPassword("");
    setDialogOpen(true);
  }
  function openEdit(u: Cashier) {
    setEditing(u);
    setUsername(u.username);
    setPassword("");
    setDialogOpen(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await apiFetch(`/api/users/${editing._id}`, {
          method: "PATCH",
          body: JSON.stringify({ username }),
        });
        toast.success("نام کاربری به‌روزرسانی شد.");
      } else {
        await apiFetch("/api/users", { method: "POST", body: JSON.stringify({ username, password }) });
        toast.success("صندوق‌دار ایجاد شد.");
      }
      setDialogOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ذخیره کاربر");
    } finally {
      setSaving(false);
    }
  }

  async function onResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!pwUser) return;
    setSaving(true);
    try {
      await apiFetch(`/api/users/${pwUser._id}/password`, {
        method: "PUT",
        body: JSON.stringify({ password: newPw }),
      });
      toast.success("گذرواژه بازنشانی شد.");
      setPwUser(null);
      setNewPw("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در بازنشانی گذرواژه");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/users/${deleteUser._id}`, { method: "DELETE" });
      toast.success("کاربر حذف شد.");
      setDeleteUser(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در حذف کاربر");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">صندوق‌دارها</h2>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          افزودن صندوق‌دار
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">هنوز صندوق‌داری ثبت نشده است.</p>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام کاربری</TableHead>
                <TableHead className="text-end">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u._id}>
                  <TableCell dir="ltr" className="text-start font-medium">
                    {u.username}
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(u)} aria-label="ویرایش">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setPwUser(u);
                          setNewPw("");
                        }}
                        aria-label="بازنشانی گذرواژه"
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteUser(u)}
                        aria-label="حذف"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* create / edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "ویرایش صندوق‌دار" : "افزودن صندوق‌دار"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="u-name">نام کاربری</Label>
              <Input
                id="u-name"
                dir="ltr"
                className="text-start"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            {!editing && (
              <div className="space-y-2">
                <Label htmlFor="u-pass">گذرواژه</Label>
                <Input
                  id="u-pass"
                  type="password"
                  dir="ltr"
                  className="text-start"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                ذخیره
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* reset password */}
      <Dialog open={!!pwUser} onOpenChange={(o) => !o && setPwUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>بازنشانی گذرواژه «{pwUser?.username}»</DialogTitle>
          </DialogHeader>
          <form onSubmit={onResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="u-newpass">گذرواژهٔ جدید</Label>
              <Input
                id="u-newpass"
                type="password"
                dir="ltr"
                className="text-start"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                ذخیره
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteUser}
        onOpenChange={(o) => !o && setDeleteUser(null)}
        title="حذف صندوق‌دار"
        description={`آیا «${deleteUser?.username}» حذف شود؟`}
        onConfirm={onDelete}
        loading={deleting}
      />
    </div>
  );
}
