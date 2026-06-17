"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoriesTab } from "@/components/admin/CategoriesTab";
import { ProductsTab } from "@/components/admin/ProductsTab";
import { UsersTab } from "@/components/admin/UsersTab";
import { PasswordTab } from "@/components/admin/PasswordTab";
import { NotificationsTab } from "@/components/admin/NotificationsTab";

export function AdminTabs() {
  return (
    <Tabs defaultValue="products" dir="rtl" className="w-full">
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0 sm:bg-muted sm:p-1">
        <TabsTrigger value="products">محصولات</TabsTrigger>
        <TabsTrigger value="categories">دسته‌بندی‌ها</TabsTrigger>
        <TabsTrigger value="users">کاربران</TabsTrigger>
        <TabsTrigger value="password">گذرواژه</TabsTrigger>
        <TabsTrigger value="notifications">اعلان‌ها</TabsTrigger>
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
