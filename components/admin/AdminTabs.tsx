"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoriesTab } from "@/components/admin/CategoriesTab";
import { UsersTab } from "@/components/admin/UsersTab";
import { PasswordTab } from "@/components/admin/PasswordTab";
import { NotificationsTab } from "@/components/admin/NotificationsTab";

// Chip-style triggers: inactive = bordered/muted, active = brand gradient fill.
const TAB =
  "h-9 rounded-full border border-border bg-transparent px-4 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground data-[state=active]:border-transparent data-[state=active]:bg-[image:var(--grad-primary)] data-[state=active]:text-primary-foreground data-[state=active]:shadow-none";

const PANEL_TABS = ["categories", "users", "password", "notifications"] as const;
type PanelTab = (typeof PANEL_TABS)[number];

function isPanelTab(v: string | null): v is PanelTab {
  return !!v && (PANEL_TABS as readonly string[]).includes(v);
}

export function AdminTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams.get("tab");
  const tab: PanelTab = isPanelTab(raw) ? raw : "categories";

  function onTabChange(next: string) {
    if (next === "products") {
      router.push("/admin/products");
      return;
    }
    if (isPanelTab(next)) {
      router.push(next === "categories" ? "/admin" : `/admin?tab=${next}`);
    }
  }

  return (
    <Tabs value={tab} onValueChange={onTabChange} dir="rtl" className="w-full">
      <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
        <TabsTrigger value="products" className={TAB} asChild>
          <Link href="/admin/products">محصولات</Link>
        </TabsTrigger>
        <TabsTrigger value="categories" className={TAB}>
          دسته‌بندی‌ها
        </TabsTrigger>
        <TabsTrigger value="users" className={TAB}>
          کاربران
        </TabsTrigger>
        <TabsTrigger value="password" className={TAB}>
          گذرواژه
        </TabsTrigger>
        <TabsTrigger value="notifications" className={TAB}>
          اعلان‌ها
        </TabsTrigger>
      </TabsList>
      <TabsContent value="categories">
        <CategoriesTab />
      </TabsContent>
      <TabsContent value="users">
        <UsersTab />
      </TabsContent>
      <TabsContent value="password">
        <PasswordTab />
      </TabsContent>
      <TabsContent value="notifications">
        <NotificationsTab />
      </TabsContent>
    </Tabs>
  );
}
