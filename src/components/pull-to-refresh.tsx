"use client";

import { useRouter } from "next/navigation";
import React, { useRef, useState, useCallback } from "react";
import { Loader2, RefreshCw } from "lucide-react";

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

type Props = { children: React.ReactNode; className?: string };

export function PullToRefresh({ children, className = "" }: Props) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const triggerRefresh = useCallback(() => {
    setIsRefreshing(true);
    router.refresh();
    // Reset after a short delay so the user sees feedback
    setTimeout(() => {
      setIsRefreshing(false);
      setPullDistance(0);
    }, 600);
  }, [router]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const el = scrollRef.current;
      if (!el || isRefreshing) return;
      // Only react when scrolled to the top
      if (el.scrollTop > 0) return;

      const y = e.touches[0].clientY;
      const diff = y - startY.current;
      if (diff > 0) {
        // Pulling down: resist a bit and cap
        const distance = Math.min(diff * 0.5, MAX_PULL);
        setPullDistance(distance);
      }
    },
    [isRefreshing]
  );

  const onTouchEnd = useCallback(() => {
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      triggerRefresh();
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, triggerRefresh]);

  return (
    <div
      ref={scrollRef}
      className={className}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Indicator above content - only on mobile when pulling */}
      {(pullDistance > 0 || isRefreshing) && (
        <div className="flex flex-col items-center justify-center gap-2 py-3 md:hidden">
          {isRefreshing ? (
            <>
              <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
              <span className="text-sm text-muted-foreground">Actualizando…</span>
            </>
          ) : (
            <>
              <RefreshCw
                className="size-8 text-primary"
                style={{
                  transform: `rotate(${Math.min(pullDistance, MAX_PULL) * 2}deg)`,
                }}
                aria-hidden
              />
              <span className="text-sm text-muted-foreground">
                {pullDistance >= PULL_THRESHOLD ? "Suelta para actualizar" : "Arrastra para actualizar"}
              </span>
            </>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
