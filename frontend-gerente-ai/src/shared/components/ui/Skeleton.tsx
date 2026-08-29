import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rounded' | 'card' | 'button';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({
  variant = 'rounded',
  width,
  height,
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'text':
        return 'rounded-md h-4 my-1';
      case 'button':
        return 'rounded-xl h-10';
      case 'card':
        return 'rounded-3xl';
      case 'rounded':
      default:
        return 'rounded-2xl';
    }
  };

  const inlineStyles: React.CSSProperties = {
    ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
    ...style,
  };

  return (
    <div
      className={`relative overflow-hidden bg-slate-200/80 dark:bg-muted/40 animate-pulse ${getVariantStyles()} ${className}`}
      style={inlineStyles}
      aria-hidden="true"
      {...props}
    >
      {/* Sutil gradiente de brillo reflejado */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent pointer-events-none" />
    </div>
  );
}
