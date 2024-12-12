import React, { useState } from "react";
import Image from "next/image";
import { twMerge } from "tailwind-merge";

const sizeMap = {
  xs: "h-6 w-6 text-xs",
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-12 w-12 text-lg",
  xl: "h-16 w-16 text-xl",
} as const;

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt: string;
  size?: keyof typeof sizeMap;
  fallback?: string;
  className?: string;
}

export default function Avatar({
  src,
  alt,
  size = "md",
  fallback,
  className,
  ...props
}: AvatarProps) {
  const [error, setError] = useState(false);
  const sizeClass = sizeMap[size];

  // Generate initials from alt text
  const initials = React.useMemo(() => {
    if (fallback) return fallback;
    return alt
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [alt, fallback]);

  // Generate UI Avatars URL
  const fallbackImageUrl = React.useMemo(() => {
    const sizeInPx = size === "xl" ? "64" : "48";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      alt
    )}&size=${sizeInPx}&background=219EBC&color=fff`;
  }, [alt, size]);

  // Check if src is an example.com URL (placeholder)
  const isPlaceholder = src?.includes("example.com");
  const imageUrl = !error && src && !isPlaceholder ? src : fallbackImageUrl;

  // Base classes for the avatar
  const baseClasses = twMerge(
    "relative rounded-full flex items-center justify-center overflow-hidden bg-primary-light dark:bg-primary-dark text-primary-dark dark:text-primary-light font-medium transition-shadow duration-200",
    sizeClass,
    className
  );

  return (
    <div className={baseClasses} {...props}>
      <Image
        src={imageUrl}
        alt={alt}
        fill
        className="object-cover"
        onError={() => setError(true)}
        sizes={`(max-width: 768px) ${size === "xl" ? "64px" : "48px"}, ${
          size === "xl" ? "64px" : "48px"
        }`}
      />
    </div>
  );
}
