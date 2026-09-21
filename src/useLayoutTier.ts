import { useEffect, useState } from "react";

// detail pushes in below 1024, every pane stacks below 700
const TABLET_BREAKPOINT = 1024;
const MOBILE_BREAKPOINT = 700;

export type LayoutTier = "desktop" | "tablet" | "mobile";

function computeTier(): LayoutTier {
  const w = window.innerWidth;
  if (w < MOBILE_BREAKPOINT) return "mobile";
  if (w < TABLET_BREAKPOINT) return "tablet";
  return "desktop";
}

export function useLayoutTier(): LayoutTier {
  const [tier, setTier] = useState<LayoutTier>(computeTier);

  useEffect(() => {
    const onResize = () => setTier(computeTier());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return tier;
}
