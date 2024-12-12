import { useCallback, useRef, useState, useEffect, useMemo } from "react";
import { ThreadWithDetails } from "@shared/types";
import { ThreadCard } from "./ThreadCard";

interface ThreadListProps {
  threads: ThreadWithDetails[];
}

const MIN_CARD_WIDTH = 400;

export function ThreadList({ threads }: ThreadListProps) {
  const [columns, setColumns] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver>();
  const prevWidthRef = useRef<number>(0);

  // Memoize column calculation function
  const calculateColumns = useCallback((width: number) => {
    return Math.max(1, Math.floor(width / MIN_CARD_WIDTH));
  }, []);

  // Memoize the update columns function with debounce
  const updateColumns = useCallback(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.offsetWidth;

    // Only update if width has changed significantly (prevent sub-pixel changes)
    if (Math.abs(width - prevWidthRef.current) < 1) return;

    prevWidthRef.current = width;
    const newColumns = calculateColumns(width);
    setColumns((prev) => (prev !== newColumns ? newColumns : prev));
  }, [calculateColumns]);

  // Effect for initial calculation and resize handling
  useEffect(() => {
    updateColumns();

    // Create ResizeObserver only once
    if (!resizeObserverRef.current) {
      resizeObserverRef.current = new ResizeObserver((entries) => {
        requestAnimationFrame(updateColumns);
      });
    }

    if (containerRef.current) {
      resizeObserverRef.current.observe(containerRef.current);
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [updateColumns]);

  // Memoize thread distribution logic
  const columnThreads = useMemo(() => {
    // Sort threads by updatedAt before distribution
    const sortedThreads = [...threads].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    const result: ThreadWithDetails[][] = Array.from(
      { length: columns },
      () => []
    );

    sortedThreads.forEach((thread, i) => {
      result[i % columns].push(thread);
    });

    return result;
  }, [threads, columns]);

  // Memoize the grid template columns style
  const gridStyle = useMemo(
    () => ({
      minWidth: MIN_CARD_WIDTH,
      gridTemplateColumns: `repeat(${columns}, minmax(${MIN_CARD_WIDTH}px, 1fr))`,
    }),
    [columns]
  );

  return (
    <div
      ref={containerRef}
      className="grid auto-rows-auto gap-md"
      style={gridStyle}
    >
      {columnThreads.map((columnContent, columnIndex) => (
        <div
          key={`column-${columnIndex}`}
          className="space-y-md animate-fade-in"
          style={{
            animationDelay: `${columnIndex * 0.1}s`,
          }}
        >
          {columnContent.map((thread, index) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              animationDelay={index * 0.05}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
