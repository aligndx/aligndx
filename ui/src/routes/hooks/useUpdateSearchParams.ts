'use client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

export const useUpdateSearchParams = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams]
  );

  const updateSearchParams = useCallback(
    (name: string, value: string) => {
      const newQueryString = createQueryString(name, value);
      router.push(`${pathname}?${newQueryString}`);
    },
    [router, pathname, createQueryString]
  );

  return updateSearchParams;
};
