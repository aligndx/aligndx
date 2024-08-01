'use client';

import { SignUpLayout } from "@/layouts/auth";


type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <SignUpLayout>{children}</SignUpLayout>
  );
}
