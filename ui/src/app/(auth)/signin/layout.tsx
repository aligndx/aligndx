'use client';

import { SignInLayout } from "@/layouts/auth";


type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return (
      <SignInLayout>{children}</SignInLayout>
  );
}
