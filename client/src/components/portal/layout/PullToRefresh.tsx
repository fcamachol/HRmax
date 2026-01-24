import { ReactNode, useRef, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
}

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

export function PullToRefresh({
  children,
  onRefresh,
  className,
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const container = containerRef.current;
    if (!container || isRefreshing) return;

    // Only start if we're at the top of scroll
    if (container.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;

    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      isPulling.current = false;
      setPullDistance(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      // Prevent default scroll when pulling down
      e.preventDefault();
      // Add resistance effect
      const resistance = Math.min(diff * 0.5, MAX_PULL);
      setPullDistance(resistance);
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current || isRefreshing) return;

    isPulling.current = false;

    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD);

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, onRefresh, isRefreshing]);

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const shouldTrigger = pullDistance >= PULL_THRESHOLD;

  return (
    <div className={cn("relative", className)}>
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 flex items-center justify-center transition-opacity duration-200",
          pullDistance > 0 || isRefreshing ? "opacity-100" : "opacity-0"
        )}
        style={{
          top: Math.max(pullDistance - 40, 8),
          height: 32,
        }}
      >
        <div
          className={cn(
            "w-8 h-8 rounded-full bg-background border border-border shadow-sm flex items-center justify-center",
            shouldTrigger && "bg-primary border-primary"
          )}
        >
          <Loader2
            className={cn(
              "h-4 w-4 transition-colors",
              isRefreshing && "animate-spin",
              shouldTrigger ? "text-primary-foreground" : "text-muted-foreground"
            )}
            style={{
              transform: isRefreshing
                ? undefined
                : `rotate(${progress * 360}deg)`,
            }}
          />
        </div>
      </div>

      {/* Content container */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto overscroll-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: isPulling.current ? undefined : "transform 0.2s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
