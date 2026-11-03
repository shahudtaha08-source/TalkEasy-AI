import * as React from "react"

const MOBILE_BREAKPOINT = 768
const DRAWER_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

/**
 * The sidebar becomes an off-canvas drawer below the desktop `lg` breakpoint.
 * This is intentionally separate from `useIsMobile()` so unrelated 768 px
 * responsive behaviour is not affected.
 */
export function useIsDrawer() {
  const [isDrawer, setIsDrawer] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${DRAWER_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsDrawer(window.innerWidth < DRAWER_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsDrawer(window.innerWidth < DRAWER_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isDrawer
}
