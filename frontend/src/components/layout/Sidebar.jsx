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
    return 0;
  }

  const isOtherItem = (item) => {
    const text = item.text.toLowerCase();
    return text.includes("message") || text.includes("notification") || text.includes("feedback");
  };

  const transition = { duration: 0.25, ease: [0.4, 0, 0.2, 1] };

  return (
    <motion.aside 
      initial={false}
      animate={{ width: collapsed ? 80 : 256 }}
      transition={transition}
      style={{ willChange: "width" }}
      className={cn(
        "fixed left-4 top-4 bottom-4 z-40 hidden flex-col border border-border bg-card lg:flex rounded-xl shadow-sm overflow-hidden"
      )}
    >
      <div className={cn(
        "flex h-20 items-center shrink-0 px-4 transition-all duration-200",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2 overflow-hidden">
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
          </Link>
        )}
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggleCollapse}
          className={cn(
            "h-9 w-9 text-muted-foreground hover:bg-muted/50 transition-colors shrink-0",
            collapsed && "mx-auto"
          )}
        >
          <SidebarSimple size={18} />
        </Button>
      </div>
      
      <div className="h-px bg-border mx-4 shrink-0" />

      <ScrollArea className="flex-1 px-3">
        <div className="flex flex-col gap-6 py-6">
          <div className="flex flex-col gap-1">
            <AnimatePresence>
              {!collapsed && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 0.5, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={transition}
                  className="px-3 mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground overflow-hidden whitespace-nowrap"
                >
                  Navigation
                </motion.p>
              )}
            </AnimatePresence>
            {menuItems
              .filter(item => !isOtherItem(item))
              .map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;

                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start h-10 transition-colors duration-200",
                        collapsed ? "px-0 justify-center" : "px-3",
                        active 
                          ? "bg-muted text-foreground shadow-xs" 
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <div className="flex w-8 items-center justify-center shrink-0">
                        <Icon size={20} weight={active ? "bold" : "regular"} />
                      </div>
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={transition}
                            className="truncate font-bold uppercase tracking-tight text-[11.5px] whitespace-nowrap ml-1"
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

          {(menuItems.some(item => isOtherItem(item))) && (
            <div className="flex flex-col gap-1">
              <AnimatePresence>
                {!collapsed && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 0.5, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={transition}
                    className="px-3 mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground overflow-hidden whitespace-nowrap"
                  >
                    Others
                  </motion.p>
                )}
              </AnimatePresence>
              {menuItems
                .filter(item => isOtherItem(item))
                .map((item) => {
                  const active = isActive(item.path);
                  const Icon = item.icon;

                  return (
                    <Link key={item.path} to={item.path}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start h-10 transition-colors duration-200 relative",
                          collapsed ? "px-0 justify-center" : "px-3",
                          active 
                            ? "bg-muted text-foreground shadow-xs" 
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                      >
                        {getUnreadCountForItem(item) > 0 && (
                            <div className={cn(
                                "absolute h-2 w-2 rounded-full bg-red-500 transition-all duration-300",
                                collapsed ? "top-2 right-4 scale-110" : "top-2.5 left-2.5"
                            )} />
                        )}
                        <div className="flex w-8 items-center justify-center shrink-0">
                          <Icon size={20} weight={active ? "bold" : "regular"} />
                        </div>
                        <AnimatePresence>
                          {!collapsed && (
                            <motion.span 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              transition={transition}
                              className="truncate font-bold uppercase tracking-tight text-[11.5px] whitespace-nowrap ml-1"
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
