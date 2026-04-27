import { useWindowDimensions } from "react-native";
import { breakpoints } from "./tokens";

/**
 * Hook para detectar breakpoints responsive
 * Retorna objeto con booleanos para cada breakpoint
 */
export function useBreakpoint() {
  const { width } = useWindowDimensions();

  return {
    width,
    isMobile: width < breakpoints.mobile,
    isTablet: width >= breakpoints.mobile && width < breakpoints.desktop,
    isDesktop: width >= breakpoints.desktop,
    isWide: width >= breakpoints.wide,
  };
}
