import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/cn";
import { ScrollArea, Button } from "../ui";
import { SidebarSimple } from "@phosphor-icons/react";
import logo from "../../assets/Vendorlink Logo.png";
import secondaryLogo from "../../assets/Vendorlink Secondary Logo Light.png";

const Sidebar = ({ menuItems, collapsed, onToggleCollapse, role }) => {
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
      <div className={cn(
        "flex h-20 items-center justify-between px-4",
        collapsed && "justify-center"
      )}>
        <Link to="/" className="flex items-center gap-2 overflow-hidden">
          {collapsed ? (
            <img 
              src={logo} 
              alt="Logo" 
              className="h-9 w-9 shrink-0 object-contain" 
            />
          ) : (
            <img 
              src={secondaryLogo} 
              alt="Vendorlink" 
              className="h-6 w-auto shrink-0 object-contain" 
            />
          )}
        </Link>
        {!collapsed && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggleCollapse}
            className="h-9 w-9 text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 transition-colors"
          >
            <SidebarSimple className="h-5 w-5" />
          </Button>
        )}
      </div>

      {collapsed && (
        <div className="flex justify-center pb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggleCollapse}
            className="h-9 w-9 text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 transition-colors"
          >
            <SidebarSimple className="h-5 w-5" />
          </Button>
        </div>
      )}
      
      <div className="h-px bg-[var(--border)] mx-4" />

      <ScrollArea className="flex-1 px-3">
        <div className="flex flex-col gap-6 py-6">
          {/* Navigation Section */}
          <div className="flex flex-col gap-1">
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted-foreground)] opacity-50">
                Navigation
              </p>
            )}
            {filteredListItems
              .filter(item => 
                !item.text.toLowerCase().includes("message") && 
                !item.text.toLowerCase().includes("notification") &&
                !item.text.toLowerCase().includes("feedback")
              )
              .map((item) => {
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
                          ? "bg-[var(--muted)] text-[var(--foreground)] shadow-xs" 
                          : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]"
                      )}
                    >
                      <Icon className={cn("h-5 w-5 shrink-0", active ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]")} />
                      {!collapsed && <span className="truncate font-bold uppercase tracking-tight text-[10px]">{item.text}</span>}
                    </Button>
                  </Link>
                );
              })}
          </div>

          {/* Other Section */}
          {(filteredListItems.some(item => 
              item.text.toLowerCase().includes("message") || 
              item.text.toLowerCase().includes("notification") ||
              item.text.toLowerCase().includes("feedback")
            )) && (
            <div className="flex flex-col gap-1">
              {!collapsed && (
                <p className="px-3 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted-foreground)] opacity-50">
                  Others
                </p>
              )}
              {filteredListItems
                .filter(item => 
                  item.text.toLowerCase().includes("message") || 
                  item.text.toLowerCase().includes("notification") ||
                  item.text.toLowerCase().includes("feedback")
                )
                .map((item) => {
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
                            ? "bg-[var(--muted)] text-[var(--foreground)] shadow-xs" 
                            : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]"
                        )}
                      >
                        <Icon className={cn("h-5 w-5 shrink-0", active ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]")} />
                        {!collapsed && <span className="truncate font-bold uppercase tracking-tight text-[10px]">{item.text}</span>}
                      </Button>
                    </Link>
                  );
                })}
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
};

export default Sidebar;
