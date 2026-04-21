import React from "react";
import { List, Bell, User, SignOut, Gear, CaretRight } from "@phosphor-icons/react";
import { 
  Button, 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  ScrollArea,
  Separator
} from "@/components/ui";
import UserAvatar from "@/components/shared/UserAvatar";
import NotificationBadge from "@/components/notifications/NotificationBadge";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/cn";
import logo from "@/assets/Vendorlink Logo.png";

const Header = ({ user, menuItems, pageTitle, pageSubtitle, onLogout }) => {
  const location = useLocation();
  const isAdmin = user?.role === "admin";
  
  const isActive = (path) => {
    if (path === `/${user?.role}`) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  // Filter menu items for mobile sidebar (admin logic matching desktop)
  const filteredMenuItems = isAdmin 
    ? menuItems.filter(item => 
        !item.text.toLowerCase().includes("message") && 
        !item.text.toLowerCase().includes("notification")
      )
    : menuItems;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[var(--border)] bg-[var(--card)]/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9 text-[var(--muted-foreground)]">
              <List className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 bg-[var(--card)] border-r border-[var(--border)]">
            <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
            <SheetDescription className="sr-only">Access site navigation and user settings.</SheetDescription>
            <SheetHeader className="p-6 text-left space-y-0 pb-5">
              <div className="flex items-center gap-2 font-extrabold tracking-tight text-[var(--foreground)] uppercase text-base">
                <img src={logo} alt="Logo" className="h-8 w-8" />
                Vendorlink
              </div>
            </SheetHeader>
            <div className="h-px bg-[var(--border)]" />
            <ScrollArea className="h-[calc(100vh-80px)] px-3 py-6">
              <nav className="flex flex-col gap-1">
                {filteredMenuItems.map((item) => {
                  const active = isActive(item.path);
                  const Icon = item.icon;
                  return (
                    <Link key={item.path} to={item.path}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-3 h-11",
                          active ? "bg-[var(--muted)] text-[var(--foreground)]" : "text-[var(--muted-foreground)]"
                        )}
                      >
                        <Icon className={cn("h-5 w-5", active ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]")} />
                        <span className="font-bold uppercase tracking-tight text-[10px]">{item.text}</span>
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <div className="min-w-0">
          <h1 className="truncate text-sm font-extrabold text-[var(--foreground)] uppercase tracking-tight sm:text-base">
            {pageTitle}
          </h1>
          {pageSubtitle && (
            <p className="hidden sm:block truncate text-xs font-medium text-[var(--muted-foreground)]">
              {pageSubtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Requirement: Header should contain the notification icon for all roles including admin */}
        <div className="relative mr-2">
          <NotificationBadge className="h-9 w-9" />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 gap-2 rounded-xl px-2 hover:bg-[var(--muted)] border border-transparent hover:border-[var(--border)]">
              <UserAvatar user={user} size="sm" />
              <div className="hidden flex-col items-start text-left sm:flex min-w-[80px]">
                <span className="text-xs font-bold leading-none truncate w-24 text-[var(--foreground)]">{user?.username}</span>
                <span className="text-[10px] text-[var(--muted-foreground)] uppercase leading-none mt-1">{user?.role}</span>
              </div>
              <CaretRight className="h-4 w-4 text-[var(--muted-foreground)] hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl border border-[var(--border)]">
            <div className="flex items-center gap-3 p-2 mb-2 bg-[var(--muted)] rounded-lg">
                <UserAvatar user={user} size="md" />
                <div className="flex flex-col">
                    <span className="text-sm font-bold truncate w-40 text-[var(--foreground)]">{user?.companyName || user?.username}</span>
                    <span className="text-[10px] text-[var(--muted-foreground)] uppercase">{user?.email}</span>
                </div>
            </div>
            <div className="h-px bg-[var(--border)] my-2" />
            <DropdownMenuItem asChild className="rounded-lg cursor-pointer py-2 focus:bg-[var(--muted)]">
              <Link to={`/${user?.role}/profile`} className="flex w-full items-center gap-2 font-bold uppercase tracking-tight text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                <User className="h-4 w-4" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-lg cursor-pointer py-2 focus:bg-[var(--muted)]">
              <Link to={`/${user?.role}/settings`} className="flex w-full items-center gap-2 font-bold uppercase tracking-tight text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                <Gear className="h-4 w-4" /> Settings
              </Link>
            </DropdownMenuItem>
            <div className="h-px bg-[var(--border)] my-2" />
            <DropdownMenuItem onClick={onLogout} className="rounded-lg cursor-pointer py-2 text-[var(--error)] focus:bg-[var(--error)]/5 font-bold uppercase tracking-tight text-[10px]">
              <SignOut className="h-4 w-4 mr-2" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
