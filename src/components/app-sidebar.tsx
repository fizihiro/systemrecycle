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
import { useSession } from "@/lib/auth-client";

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

  if (items.length === 0) return null;

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
  const { data: session } = useSession();
  const role = (
    session?.user && "role" in session.user
      ? String(session.user.role)
      : "admin"
  ).toLowerCase();

  const filteredMasters = masterItems.filter((item) => {
    if (role === "admin") return true;
    if (role === "manufacturer") {
      return (
        item.href === "/dashboard/manufacturers" ||
        item.href === "/dashboard/sack-catalog"
      );
    }
    if (role === "supplier") {
      return (
        item.href === "/dashboard/farmers" ||
        item.href === "/dashboard/suppliers" ||
        item.href === "/dashboard/sack-catalog"
      );
    }
    if (role === "recycler") {
      return (
        item.href === "/dashboard/recyclers" ||
        item.href === "/dashboard/sack-catalog"
      );
    }
    return false;
  });

  const filteredTransactions = transactionItems.filter((item) => {
    if (role === "admin") return true;
    if (role === "manufacturer") {
      return item.href === "/dashboard/manufacturer-sales";
    }
    if (role === "supplier") {
      return (
        item.href === "/dashboard/fertilizer-distribution" ||
        item.href === "/dashboard/sack-returns"
      );
    }
    if (role === "recycler") {
      return (
        item.href === "/dashboard/recycler-delivery" ||
        item.href === "/dashboard/manufacturer-sales"
      );
    }
    return false;
  });

  return (
    <Sidebar className="border-sidebar-border">
      <SidebarHeader className="border-sidebar-border border-b px-4 py-5">
        <Link href="/dashboard" className="flex items-start gap-3">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-xl">
            <Recycle className="size-5" strokeWidth={2.25} />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold tracking-tight">Sack2Loop</span>
            <span className="text-sidebar-foreground/65 text-xs leading-snug">
              Fertiliser &amp; Feed Sack Circular Economy
            </span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-1 py-2">
        <NavGroup label="Overview" items={overviewItems} />
        <NavGroup label="Masters" items={filteredMasters} />
        <NavGroup label="Transactions" items={filteredTransactions} />
      </SidebarContent>
      <SidebarFooter className="border-sidebar-border border-t p-4">
        <div className="flex flex-col gap-0.5">
          <p className="text-sidebar-foreground/80 text-xs font-medium">
            Sack2Loop · Multi-Tenant
          </p>
          <p className="text-sidebar-foreground/60 text-[11px] capitalize">
            Role: {role === "manufacturer" ? "PRO Manufacturer" : role}
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
