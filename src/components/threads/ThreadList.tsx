import { useCallback, useRef, useState, useEffect, useMemo } from "react";
import { ThreadWithDetails } from "@shared/types";
import { ThreadCard } from "./ThreadCard";
import { logger } from "@/lib/api/logger";

interface ThreadListProps {
  threads: ThreadWithDetails[];
}

const MIN_CARD_WIDTH = 400;

export function ThreadList({ threads }: ThreadListProps) {
  const [columns, setColumns] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Memoize column calculation function
  const calculateColumns = useCallback((width: number) => {
    return Math.max(1, Math.floor(width / MIN_CARD_WIDTH));
  }, []);

  // Memoize the update columns function
  const updateColumns = useCallback(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.offsetWidth;
    const newColumns = calculateColumns(width);
    setColumns((prev) => (prev !== newColumns ? newColumns : prev));
  }, [calculateColumns]);

  // Effect for initial calculation and resize handling
  useEffect(() => {
    updateColumns();
    const resizeObserver = new ResizeObserver(updateColumns);

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateColumns]);

  // Memoize thread distribution logic
  const columnThreads = useMemo(() => {
    logger.debug("Calculating thread distribution", {
      threadCount: threads.length,
      columns,
    });

    const result: ThreadWithDetails[][] = Array.from(
      { length: columns },
      () => []
    );

    threads.forEach((thread, i) => {
      result[i % columns].push(thread);
    });

    return result;
  }, [threads, columns]);

  return (
    <div
      ref={containerRef}
      className="grid-auto-fit gap-md animate-fade-in"
      style={{
        minWidth: MIN_CARD_WIDTH,
      }}
    >
      {columnThreads.map((columnContent, columnIndex) => (
        <div
          key={columnIndex}
          className="space-y-md"
          style={{
            // Stagger animation delay based on column index
            animationDelay: `${columnIndex * 0.1}s`,
          }}
        >
          {columnContent.map((thread, threadIndex) => (
            <div
              key={thread.id}
              className="animate-slide-up"
              style={{
                // Stagger animation delay based on thread index
                animationDelay: `${
                  (columnIndex * columnContent.length + threadIndex) * 0.05
                }s`,
              }}
            >
              <ThreadCard thread={thread} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
