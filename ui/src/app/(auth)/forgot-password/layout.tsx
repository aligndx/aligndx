'use client';

import { GeneralLayout } from "@/layouts/general";


type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return (
      <GeneralLayout>{children}</GeneralLayout>
  );
}
