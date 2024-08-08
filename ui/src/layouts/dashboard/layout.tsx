"use client";
import React, { FC, ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import Header from "../common/header";
import ThemeToggle from "../common/theme-toggle";
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
  const pathSegments = path.split('/').filter(Boolean);
  const lastSegment = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : '';
  const capitalize = (str : string) => str.charAt(0).toUpperCase() + str.slice(1);
  const capitalizedSegment = capitalize(lastSegment);

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row overflow-hidden",
        "h-screen"
      )}
    >
      <SideNav open={open} toggleMobileSideNav={() => setOpen(!open)}/>
      <div className="flex flex-grow flex-col pt-2">
        <Header className="flex flex-row items-center justify-between border-0">
          <div className="flex items-center text-2xl font-medium gap-2">
            <Button onClick={() => setOpen(!open)} variant="ghost" size="icon" className="md:hidden p-2">
              <Menu />
            </Button>
            {capitalizedSegment}
          </div>
          <div className="flex flex-row items-center gap-5">
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