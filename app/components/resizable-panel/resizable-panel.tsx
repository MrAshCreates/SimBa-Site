import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import classNames from "classnames";
import styles from "./resizable-panel.module.css";

interface ResizablePanelProps {
  /**
   * Direction of the panel layout
   * @important
   * @enum horizontal,vertical
   */
  direction?: "horizontal" | "vertical";
  /**
   * Initial size of the first panel (in pixels or percentage)
   * @important
   */
  initialSize?: number;
  /**
   * Minimum size of the first panel
   * @important
   * @min 50
   */
  minSize?: number;
  /**
   * Maximum size of the first panel
   * @important
   */
  maxSize?: number;
  /**
   * Whether resizing is disabled
   * @important
   */
  disabled?: boolean;
  /**
   * Callback when panel size changes
   * @important
   */
  onResize?: (size: number) => void;
  /**
   * First panel content
   * @important
   */
  children: [ReactNode, ReactNode];
  /**
   * Additional CSS class name
   */
  className?: string;
}

export function ResizablePanel({
  direction = "horizontal",
  initialSize = 300,
  minSize = 100,
  maxSize,
  disabled = false,
  onResize,
  children,
  className,
}: ResizablePanelProps) {
  const [size, setSize] = useState(initialSize);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef(0);
  const startSizeRef = useRef(0);

  const handleMouseDown = useCallback(
    (e: ReactMouseEvent) => {
      if (disabled) return;

      e.preventDefault();
      setIsResizing(true);
      startPosRef.current = direction === "horizontal" ? e.clientX : e.clientY;
      startSizeRef.current = size;
    },
    [disabled, direction, size],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const currentPos = direction === "horizontal" ? e.clientX : e.clientY;
      const delta = currentPos - startPosRef.current;
      let newSize = startSizeRef.current + delta;

      // Apply constraints
      if (newSize < minSize) {
        newSize = minSize;
      }

      if (maxSize && newSize > maxSize) {
        newSize = maxSize;
      }

      // Ensure we don't exceed container bounds
      if (containerRef.current) {
        const containerSize =
          direction === "horizontal" ? containerRef.current.offsetWidth : containerRef.current.offsetHeight;
        const maxAllowedSize = containerSize - 100; // Leave space for second panel

        if (newSize > maxAllowedSize) {
          newSize = maxAllowedSize;
        }
      }

      setSize(newSize);
      onResize?.(newSize);
    },
    [isResizing, direction, minSize, maxSize, onResize],
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = direction === "horizontal" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp, direction]);

  const isHorizontal = direction === "horizontal";
  const firstPanelStyle = {
    [isHorizontal ? "width" : "height"]: `${size}px`,
    flexShrink: 0,
  };

  const secondPanelStyle = {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
  };

  return (
    <div
      ref={containerRef}
      className={classNames(styles.container, isHorizontal ? styles.horizontal : styles.vertical, className)}
      style={{ flexDirection: isHorizontal ? "row" : "column" }}
    >
      <div className={styles.panel} style={firstPanelStyle}>
        {children[0]}
      </div>

      <div
        className={classNames(
          styles.resizer,
          isHorizontal ? styles.resizerHorizontal : styles.resizerVertical,
          isResizing && styles.resizerActive,
          disabled && styles.resizerDisabled,
        )}
        onMouseDown={handleMouseDown}
      />

      <div className={styles.panel} style={secondPanelStyle}>
        {children[1]}
      </div>
    </div>
  );
}
