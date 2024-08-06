"use client";
import React, { FC, ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import Header from "../common/header";
import ThemeToggle from "../common/theme-toggle";
import { UserNav } from "../common/user-nav";
import { Notifications } from "../common/notifications";
import { Button } from "@/components/ui/button";
import { Menu } from "@/components/icons";

type Props = {
  children: ReactNode;
};


const DashboardLayout: FC<Props> = ({ children }) => {

  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row w-full flex-1 max-w-7xl mx-auto overflow-hidden",
        "h-screen"
      )}
    >
 
      <div className="flex flex-grow flex-col p-2">
        <Header className="flex flex-row items-center justify-between border-0">
          <div>
            <Button onClick={() => setOpen(!open)} variant="ghost" size="icon" className="md:hidden p-2">
              <Menu />
            </Button>
          </div>
          <div className="flex flex-row items-center gap-2">
            <Notifications />
            <UserNav />
            <ThemeToggle />
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