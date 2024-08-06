"use client";
import React, { FC, ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import Header from "../common/header";
import ThemeToggle from "../common/theme-toggle";
import { UserNav } from "../common/user-nav";
import { Notifications } from "../common/notifications";
import { Button } from "@/components/ui/button";
import { Menu } from "@/components/icons";
import { usePathname } from '@/routes'
import SideNav from "./side-nav";
type Props = {
  children: ReactNode;
};


const DashboardLayout: FC<Props> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const path = usePathname()
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row w-full flex-1 max-w-7xl overflow-hidden",
        "h-screen"
      )}
    >
      <SideNav open={open} toggleMobileSideNav={() => setOpen(!open)}/>
      <div className="flex flex-grow flex-col p-2">
        <Header className="flex flex-row items-center justify-between border-0">
          <div className="flex items-center text-md font-bold gap-2">
            <Button onClick={() => setOpen(!open)} variant="ghost" size="icon" className="md:hidden p-2">
              <Menu />
            </Button>
              {path.split("/").join("").charAt(0).toUpperCase() + path.split("/").join("").slice(1)}
          </div>
          <div className="flex flex-row items-center gap-5">
            <ThemeToggle />
            <Notifications />
          </div>
        </Header>
        <main>
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;