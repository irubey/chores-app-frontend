import { useCallback, useRef, useState, useEffect } from "react";
import { ThreadWithDetails } from "@shared/types";
import { ThreadCard } from "./ThreadCard";
import { logger } from "@/lib/api/logger";

interface ThreadListProps {
  threads: ThreadWithDetails[];
}

export function ThreadList({ threads }: ThreadListProps) {
  const [columns, setColumns] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate number of columns based on container width
  useEffect(() => {
    const updateColumns = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.offsetWidth;
      const newColumns = Math.max(1, Math.floor(width / 400)); // 400px min card width
      setColumns(newColumns);
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  logger.debug("Rendering thread list", {
    threadCount: threads.length,
    columns,
  });

  // Split threads into columns
  const columnThreads = useCallback(() => {
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
      className="grid gap-md"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {columnThreads().map((columnContent, columnIndex) => (
        <div key={columnIndex} className="space-y-md">
          {columnContent.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} />
          ))}
        </div>
      ))}
    </div>
  );
}
