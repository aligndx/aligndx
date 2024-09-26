import * as React from "react";

// Define default breakpoints for convenience
const defaultBreakpoints = {
  isMobile: "(max-width: 768px)",
  isTablet: "(max-width: 1024px)",
  isDesktop: "(min-width: 1025px)",
};

type BreakpointKey = keyof typeof defaultBreakpoints;

export function useMediaQuery(queryOrKey: string | BreakpointKey) {
  const query = typeof queryOrKey === 'string' 
    ? queryOrKey // Custom media query
    : defaultBreakpoints[queryOrKey]; // Predefined breakpoint

  const [value, setValue] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  const onChange = React.useCallback((event: MediaQueryListEvent) => {
    setValue(event.matches);
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return; // Avoid running on the server side
    }

    const result = window.matchMedia(query);
    result.addEventListener("change", onChange);
    setValue(result.matches);

    return () => result.removeEventListener("change", onChange);
  }, [query, onChange]);

  return value;
}
