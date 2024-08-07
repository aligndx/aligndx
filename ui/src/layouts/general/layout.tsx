"use client";
import React, { FC, ReactNode } from "react";
import { cn } from "@/lib/utils";
import Header from "../common/header";
import ThemeToggle from "../common/theme-toggle";
import { usePathname } from '@/routes'
import Logo from "@/components/logo";

type Props = {
  children: ReactNode;
};


const GeneralLayout: FC<Props> = ({ children }) => {
  const path = usePathname()
  return (
    <div
      className={cn(
        "flex w-full",
        "h-screen"
      )}
    >
      <div className="flex flex-grow flex-col p-2">
        <Header className="flex flex-row items-center justify-between border-0">
            <Logo full={false} />
            <ThemeToggle /> 
        </Header>
        <main className="flex items-center h-full">
          {children}
        </main>
      </div>
    </div>
  );
}

export default GeneralLayout;