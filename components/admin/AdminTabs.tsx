"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoriesTab } from "@/components/admin/CategoriesTab";
import { ProductsTab } from "@/components/admin/ProductsTab";
import { UsersTab } from "@/components/admin/UsersTab";
import { PasswordTab } from "@/components/admin/PasswordTab";
import { NotificationsTab } from "@/components/admin/NotificationsTab";

// Chip-style triggers: inactive = bordered/muted, active = solid violet (clearly distinct).
const TAB =
  "h-9 rounded-full border border-border bg-transparent px-4 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none";

export function AdminTabs() {
  return (
    <Tabs defaultValue="products" dir="rtl" className="w-full">
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
        <TabsTrigger value="products" className={TAB}>
          محصولات
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
      <TabsContent value="products">
        <ProductsTab />
      </TabsContent>
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
