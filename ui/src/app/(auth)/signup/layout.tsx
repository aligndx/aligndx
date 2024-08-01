'use client';

import AuthLayout from "@/layouts/auth";

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return (
      <AuthLayout reverse>{children}</AuthLayout>
  );
}
