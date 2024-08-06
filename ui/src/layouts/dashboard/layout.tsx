"use client";
import React, { FC, ReactNode, useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import Logo from "@/components/logo";
import { Analyze, Chart, DashboardIcon, ArrowLeft, Menu } from "@/components/icons";
import { routes } from "@/routes";
import Header from "../common/header";
import ThemeToggle from "../common/theme-toggle";
import { UserNav } from "../common/user-nav";
import { Notifications } from "../common/notifications";
import { Button } from "@/components/ui/button";

type Props = {
  children: ReactNode;
};

const commonStyles = "flex-shrink-0"
const links = [
  {
    label: "Dashboard",
    href: routes.dashboard.root,
    icon: (
      <DashboardIcon className={commonStyles} />
    ),
  },
  {
    label: "Analyze",
    href: routes.dashboard.analyze,
    icon: (
      <Analyze className={commonStyles} />
    ),
  },
  {
    label: "Visualize",
    href: routes.dashboard.visualize,
    icon: (
      <Chart className={commonStyles} />
    ),
  }

];

const DashboardLayout: FC<Props> = ({ children }) => {

  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row w-full flex-1 max-w-7xl mx-auto overflow-hidden",
        "h-screen"
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10 border-r-2">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden justify-between">
            {open ? <Logo /> : <Logo full={false} />}
            <div className="mt-8 flex flex-col gap-5">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
            <SidebarLink link={
              {
                label: "Logout",
                href: "#",
                icon: (
                  <ArrowLeft className="h-5 w-5 flex-shrink-0" />
                ),
              }} />
          </div>

        </SidebarBody>
      </Sidebar>
      <div className="flex flex-grow flex-col">
        <Header className="flex flex-row items-center justify-between">
          <div>
            <Button onClick={() => setOpen(!open)} variant="ghost" size="icon" className="md:hidden p-2">
              <Menu />
            </Button>
          </div>
          <div className="flex flex-row items-center gap-2">
            <ThemeToggle />
            <Notifications />
            <UserNav />
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