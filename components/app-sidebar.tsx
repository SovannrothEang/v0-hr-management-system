"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useLogout } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Users,
  Clock,
  DollarSign,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Building2,
  CalendarDays,
} from "lucide-react";

const navigation = [
  { 
    name: "Dashboard", 
    href: "/dashboard", 
    icon: LayoutDashboard,
    roles: ['admin', 'hr_manager', 'employee'] // All roles
  },
  { 
    name: "Employees", 
    href: "/employees", 
    icon: Users,
    roles: ['admin', 'hr_manager'] // Admin and HR only
  },
  { 
    name: "Attendance", 
    href: "/attendance", 
    icon: Clock,
    roles: ['admin', 'hr_manager', 'employee'] // All roles
  },
  { 
    name: "Leave Requests", 
    href: "/leave-requests", 
    icon: CalendarDays,
    roles: ['admin', 'hr_manager', 'employee'] // All roles
  },
  { 
    name: "Payroll", 
    href: "/payroll", 
    icon: DollarSign,
    roles: ['admin', 'hr_manager'] // Admin and HR only
  },
  { 
    name: "Reports", 
    href: "/reports", 
    icon: FileText,
    roles: ['admin', 'hr_manager'] // Admin and HR only
  },
  { 
    name: "Settings", 
    href: "/settings", 
    icon: Settings,
    roles: ['admin', 'hr_manager', 'employee'] // All roles
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useSessionStore();
  const { isCollapsed, toggle } = useSidebarStore();
  const { mutate: logout } = useLogout();
  const { role } = usePermissions();

  // Filter navigation items based on user role
  const filteredNavigation = navigation.filter((item) => 
    role && item.roles.includes(role)
  );

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => router.push("/login"),
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "h-16 flex items-center border-b border-sidebar-border relative",
          isCollapsed ? "justify-center px-2" : "justify-between px-4"
        )}>
          <Link href="/dashboard" className={cn(
            "flex items-center gap-2",
            !isCollapsed && "min-w-0 flex-1"
          )}>
            <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
              <Building2 className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            {!isCollapsed && (
              <span className="text-lg font-semibold text-sidebar-foreground truncate">
                HRFlow
              </span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent absolute -right-3 top-1/2 -translate-y-1/2 z-50 shadow-sm",
              "flex items-center justify-center"
            )}
            onClick={toggle}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href;
              const NavContent = (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isCollapsed && "justify-center px-2"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-sidebar-primary")} />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );

              if (isCollapsed) {
                return (
                  <li key={item.name}>
                    <Tooltip>
                      <TooltipTrigger asChild>{NavContent}</TooltipTrigger>
                      <TooltipContent side="right" className="font-medium" sideOffset={10}>
                        {item.name}
                      </TooltipContent>
                    </Tooltip>
                  </li>
                );
              }

              return (
                <li key={item.name}>
                  <Tooltip>
                    <TooltipTrigger asChild>{NavContent}</TooltipTrigger>
                    <TooltipContent side="right" className="font-medium" sideOffset={10}>
                      {item.name}
                    </TooltipContent>
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Theme Toggle */}
        <div className={cn(
          "p-2 border-t border-sidebar-border",
          isCollapsed ? "flex justify-center" : "flex items-center justify-between"
        )}>
          {!isCollapsed && (
            <span className="text-xs font-medium text-muted-foreground px-2">Theme</span>
          )}
          <ThemeToggle />
        </div>

        {/* User Menu */}
        <div className="p-2 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "w-full flex items-center gap-3 p-2 rounded-md hover:bg-sidebar-accent transition-colors cursor-pointer overflow-hidden",
                  isCollapsed && "justify-center"
                )}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                    {user ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.role === "admin"
                        ? "Administrator"
                        : user?.role === "hr_manager"
                        ? "HR Manager"
                        : "Employee"}
                    </p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 max-w-[224px]">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </TooltipProvider>
  );
}
