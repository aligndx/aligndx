import * as React from "react";

// Define Tailwind breakpoints
const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

type BreakpointKey = keyof typeof breakpoints;

// Helper functions for breakpoints
const theme = {
  breakpoints: {
    up: (key: BreakpointKey) => `(min-width: ${breakpoints[key]}px)`,
    down: (key: BreakpointKey) => `(max-width: ${breakpoints[key] - 0.05}px)`, // Subtract a small amount to handle pixel rounding
    only: (key: BreakpointKey) => {
      if (key === '2xl') return `(min-width: ${breakpoints[key]}px)`;
      return `(min-width: ${breakpoints[key]}px) and (max-width: ${
        breakpoints[getNextKey(key)] - 0.05
      }px)`;
    },
    not: (key: BreakpointKey) => {
      if (key === '2xl') return `(max-width: ${breakpoints[key] - 0.05}px)`;
      return `(max-width: ${breakpoints[key] - 0.05}px), (min-width: ${
        breakpoints[getNextKey(key)]
      }px)`;
    },
    between: (start: BreakpointKey, end: BreakpointKey) =>
      `(min-width: ${breakpoints[start]}px) and (max-width: ${
        breakpoints[end] - 0.05
      }px)`,
  },
};

// Get next breakpoint for "only" and "not" methods
function getNextKey(key: BreakpointKey): BreakpointKey {
  const keys = Object.keys(breakpoints) as BreakpointKey[];
  const index = keys.indexOf(key);
  return keys[index + 1] as BreakpointKey;
}

export function useMediaQuery(
  queryOrKey: string | BreakpointKey,
  method?: keyof typeof theme.breakpoints,
  endKey?: BreakpointKey // Optional second argument for the "between" method
) {
  let query = queryOrKey;

  // Handle different methods
  if (typeof queryOrKey === 'string' && method) {
    if (method === 'between') {
      // If the method is "between", we need both start and end keys
      if (!endKey) {
        throw new Error("The 'between' method requires a second breakpoint key as an argument.");
      }
      query = theme.breakpoints.between(queryOrKey as BreakpointKey, endKey);
    } else {
      // For other methods, use the appropriate helper
      query = theme.breakpoints[method](queryOrKey as BreakpointKey);
    }
  }

  const [value, setValue] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false; // Avoid errors in SSR
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
