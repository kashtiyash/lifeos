"use client";

import * as React from "react";

/**
 * Subscribe to a CSS media query. Returns `false` during server rendering and
 * the first paint, then the real value after mount. Use only for progressive
 * presentation choices (for example dialog vs. bottom sheet); never for
 * security or data decisions.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
