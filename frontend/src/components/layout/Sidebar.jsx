import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/cn";
import { ScrollArea, Button, Separator } from "../ui";
import { CaretLeft, CaretRight, SignOut } from "@phosphor-icons/react";
import logo from "../../assets/Vendorlink Logo.png";

const Sidebar = ({ menuItems, collapsed, onToggleCollapse, role, onLogout }) => {
  const location = useLocation();
  const isAdmin = role === "admin";

  const isActive = (path) => {
    if (path === `/${role}`) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  // Filter menu items for admin: remove messages and notifications from sidebar
  const filteredListItems = isAdmin 
    ? menuItems.filter(item => 
        !item.text.toLowerCase().includes("message") && 
        !item.text.toLowerCase().includes("notification")
      )
    : menuItems;

  return (
    <aside className={cn(
      "fixed left-4 top-4 bottom-4 z-40 hidden flex-col border border-[var(--border)] bg-[var(--card)] transition-all duration-300 lg:flex rounded-2xl shadow-sm",
      collapsed ? "w-20" : "w-64"
    )}>
      <div className="flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 overflow-hidden">
          <img src={logo} alt="Logo" className="h-8 w-8 shrink-0" />
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight text-[var(--foreground)] truncate uppercase">
              Vendorlink
            </span>
          )}
        </Link>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggleCollapse}
          className="h-8 w-8 text-[var(--muted-foreground)]"
        >
          {collapsed ? <CaretRight className="h-4 w-4" /> : <CaretLeft className="h-4 w-4" />}
        </Button>
      </div>
      
      <div className="h-px bg-[var(--border)] mx-4" />

      <ScrollArea className="flex-1 px-3">
        <nav className="flex flex-col gap-1 py-6">
          {filteredListItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;

            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-10 transition-all duration-200",
                    collapsed ? "px-0 justify-center" : "px-3",
                    active 
                      ? "bg-[var(--muted)] text-[var(--foreground)] shadow-sm translate-x-1" 
                      : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)] hover:translate-x-1"
                  )}
                >
                  <Icon className={cn("h-5 w-5 shrink-0", active ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]")} />
                  {!collapsed && <span className="truncate font-bold uppercase tracking-tight text-[10px]">{item.text}</span>}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {!isAdmin && (
        <>
          <div className="h-px bg-[var(--border)] mx-4" />
          <div className="p-4 mt-auto">
            <Button 
                variant="ghost" 
                onClick={onLogout}
                className={cn(
                    "w-full justify-start gap-3 text-[var(--error)] hover:bg-[var(--error)]/5",
                    collapsed ? "px-0 justify-center" : "px-3"
                )}
            >
                <SignOut className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="font-bold uppercase tracking-tight text-[10px]">SignOut</span>}
            </Button>
          </div>
        </>
      )}
    </aside>
  );
};

export default Sidebar;
