"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Factory,
  LayoutDashboard,
  Leaf,
  Package,
  Recycle,
  RotateCcw,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const overviewItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
];

const masterItems = [
  { title: "Farmers", href: "/dashboard/farmers", icon: Users },
  { title: "Suppliers", href: "/dashboard/suppliers", icon: Truck },
  { title: "Recyclers", href: "/dashboard/recyclers", icon: Recycle },
  {
    title: "Manufacturers",
    href: "/dashboard/manufacturers",
    icon: Factory,
  },
  {
    title: "Sack Catalog",
    href: "/dashboard/sack-catalog",
    icon: Package,
  },
];

const transactionItems = [
  {
    title: "Fertilizer Distribution",
    href: "/dashboard/fertilizer-distribution",
    icon: Leaf,
  },
  {
    title: "Sack Returns",
    href: "/dashboard/sack-returns",
    icon: RotateCcw,
  },
  {
    title: "Recycler Delivery",
    href: "/dashboard/recycler-delivery",
    icon: Building2,
  },
  {
    title: "Manufacturer Sales",
    href: "/dashboard/manufacturer-sales",
    icon: ShoppingCart,
  },
];

function NavGroup({
  label,
  items,
}: {
  label: string;
  items: { title: string; href: string; icon: React.ComponentType<{ className?: string }> }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-foreground/60 text-[10px] font-semibold uppercase tracking-widest">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                render={<Link href={item.href} />}
                isActive={pathname === item.href}
                className="data-active:bg-sidebar-accent data-active:text-sidebar-primary"
              >
                <item.icon className="size-4" />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  return (
    <Sidebar className="border-sidebar-border">
      <SidebarHeader className="border-sidebar-border border-b px-4 py-5">
        <Link href="/dashboard" className="flex items-start gap-3">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-xl">
            <Recycle className="size-5" strokeWidth={2.25} />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold tracking-tight">Recycle System</span>
            <span className="text-sidebar-foreground/65 text-xs leading-snug">
              Plastic Sack Circular Economy
            </span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-1 py-2">
        <NavGroup label="Overview" items={overviewItems} />
        <NavGroup label="Masters" items={masterItems} />
        <NavGroup label="Transactions" items={transactionItems} />
      </SidebarContent>
      <SidebarFooter className="border-sidebar-border border-t p-4">
        <p className="text-sidebar-foreground/50 text-xs">
          UiTM Circular Economy Prototype
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
