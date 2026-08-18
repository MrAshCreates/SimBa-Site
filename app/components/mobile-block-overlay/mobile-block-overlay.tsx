import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import { Monitor } from "lucide-react";
import styles from "./mobile-block-overlay.module.css";

const MOBILE_BREAKPOINT = 1024;
const BLOCKED_ROUTES = ["/playground"];

export function MobileBlockOverlay() {
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    };

    // Check on mount
    checkViewport();

    // Listen for resize events
    window.addEventListener("resize", checkViewport);

    return () => {
      window.removeEventListener("resize", checkViewport);
    };
  }, []);

  // Only show overlay on mobile for blocked routes
  const shouldShowOverlay = isMobile && BLOCKED_ROUTES.includes(location.pathname);

  if (!shouldShowOverlay) {
    return null;
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <Monitor className={styles.icon} />
        <h1 className={styles.title}>Desktop Only</h1>
        <p className={styles.message}>
          The SimBa Playground is designed for desktop use only. Please access it from a larger screen to write and test
          your hybrid Python/Rust code.
        </p>
        <p className={styles.submessage}>
          You can still explore SimBa features, create an account, and learn about the language on mobile.
        </p>
      </div>
    </div>
  );
}
