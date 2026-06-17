"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      username: username.trim(),
      password,
      redirect: false,
    });
    setLoading(false);
    if (!res || res.error) {
      setError("نام کاربری یا گذرواژه نادرست است.");
      return;
    }
    const callbackUrl = params.get("callbackUrl") || "/admin";
    router.replace(callbackUrl);
    router.refresh();
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4">
      <div className="vapor-blob -top-24 start-1/4 h-72 w-72 bg-primary/30 animate-vapor-drift" />
      <div className="vapor-blob bottom-0 end-1/4 h-64 w-64 bg-fuchsia-500/20 animate-vapor-drift" />
      <Card className="relative z-10 w-full max-w-sm border-border/60 bg-card/80 backdrop-blur">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Lock className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">
            ورود به پنل <span className="font-bold tracking-tight">BehanVape</span>
          </CardTitle>
          <CardDescription>برای مدیریت کاتالوگ وارد شوید</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">نام کاربری</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                dir="ltr"
                className="text-start"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">گذرواژه</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                dir="ltr"
                className="text-start"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              ورود
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
