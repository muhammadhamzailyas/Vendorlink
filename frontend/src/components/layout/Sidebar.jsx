import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { ScrollArea, Button } from "../ui";
import { SidebarSimple } from "@phosphor-icons/react";
import { useNotifications } from "@/context/NotificationContext";
import logo from "../../assets/Vendorlink Logo.png";
import secondaryLogo from "../../assets/Vendorlink Secondary Logo.png";

const Sidebar = ({ menuItems, collapsed, onToggleCollapse, role }) => {
  const location = useLocation();
  const isAdmin = role === "admin";
  const { unreadChatCount } = useNotifications();

  const isActive = (path) => {
    if (path === `/${role}`) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };
  
  const getUnreadCountForItem = (item) => {
    if (item.path.includes("chat") || item.text.toLowerCase().includes("message")) {
      return unreadChatCount;
    }
    // Can add other counts here later
    return 0;
  }

  const filteredListItems = isAdmin 
    ? menuItems.filter(item => 
        !item.text.toLowerCase().includes("message") && 
        !item.text.toLowerCase().includes("notification")
      )
    : menuItems;

  return (
    <motion.aside 
      initial={false}
      animate={{ width: collapsed ? 80 : 256 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "fixed left-4 top-4 bottom-4 z-40 hidden flex-col border border-border bg-card lg:flex rounded-2xl shadow-sm overflow-hidden"
      )}
    >
      <div className={cn(
        "flex h-20 items-center justify-between px-4 shrink-0",
        collapsed && "justify-center"
      )}>
        <Link to="/" className="flex items-center gap-2 overflow-hidden">
          <AnimatePresence mode="wait">
            {collapsed ? (
              <motion.img 
                key="collapsed-logo"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                src={logo} 
                alt="Logo" 
                className="h-9 w-9 shrink-0 object-contain" 
              />
            ) : (
              <motion.img 
                key="expanded-logo"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                src={secondaryLogo} 
                alt="Vendorlink" 
                className="h-6 w-auto shrink-0 object-contain" 
              />
            )}
          </AnimatePresence>
        </Link>
        {!collapsed && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggleCollapse}
            className="h-9 w-9 text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <SidebarSimple className="h-5 w-5" />
          </Button>
        )}
      </div>

      {collapsed && (
        <div className="flex justify-center pb-4 shrink-0">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggleCollapse}
            className="h-9 w-9 text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <SidebarSimple className="h-5 w-5" />
          </Button>
        </div>
      )}
      
      <div className="h-px bg-border mx-4 shrink-0" />

      <ScrollArea className="flex-1 px-3">
        <div className="flex flex-col gap-6 py-6">
          {/* Navigation Section */}
          <div className="flex flex-col gap-1">
            <AnimatePresence>
              {!collapsed && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 0.5, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-3 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground overflow-hidden whitespace-nowrap"
                >
                  Navigation
                </motion.p>
              )}
            </AnimatePresence>
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
                        "w-full justify-start gap-3 h-10 transition-colors duration-200",
                        collapsed ? "px-0 justify-center" : "px-3",
                        active 
                          ? "bg-muted text-foreground shadow-xs" 
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <Icon className={cn("h-5 w-5 shrink-0", active ? "text-foreground" : "text-muted-foreground")} />
                      <AnimatePresence mode="popLayout">
                        {!collapsed && (
                          <motion.span 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="truncate font-bold uppercase tracking-tight text-[10px] whitespace-nowrap"
                          >
                            {item.text}
                          </motion.span>
                        )}
                      </AnimatePresence>
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
              <AnimatePresence>
                {!collapsed && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 0.5, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-3 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground overflow-hidden whitespace-nowrap"
                  >
                    Others
                  </motion.p>
                )}
              </AnimatePresence>
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
                          "w-full justify-start gap-3 h-10 transition-colors duration-200 relative",
                          collapsed ? "px-0 justify-center" : "px-3",
                          active 
                            ? "bg-muted text-foreground shadow-xs" 
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                      >
                        {getUnreadCountForItem(item) > 0 && (
                            <div className={cn(
                                "absolute h-2 w-2 rounded-full bg-red-500",
                                collapsed ? "top-2 right-2" : "top-2.5 left-2.5"
                            )} />
                        )}
                        <Icon className={cn("h-5 w-5 shrink-0", active ? "text-foreground" : "text-muted-foreground")} />
                        <AnimatePresence mode="popLayout">
                          {!collapsed && (
                            <motion.span 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              className="truncate font-bold uppercase tracking-tight text-[10px] whitespace-nowrap"
                            >
                              {item.text}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Button>
                    </Link>
                  );
                })}
            </div>
          )}
        </div>
      </ScrollArea>
    </motion.aside>
  );
};

export default Sidebar;



