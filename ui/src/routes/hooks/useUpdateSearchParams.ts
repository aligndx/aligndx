'use client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

export const useUpdateSearchParams = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (paramsToUpdate: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.keys(paramsToUpdate).forEach((key) => {
        const value = paramsToUpdate[key];
        if (value !== undefined) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      return params.toString();
    },
    [searchParams]
  );

  const updateSearchParams = useCallback(
    (paramsToUpdate: Record<string, string | undefined>) => {
      const newQueryString = createQueryString(paramsToUpdate);
      router.push(`${pathname}?${newQueryString}`);
    },
    [router, pathname, createQueryString]
  );

  return updateSearchParams;
};
