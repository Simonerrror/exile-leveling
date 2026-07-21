import { useState, type ReactNode } from "react";
import styles from "./styles.module.css";

interface EntityImageProps {
  alt: string;
  fallback?: ReactNode;
  size?: number;
  src?: string;
}

export function EntityImage({ alt, fallback = "◆", size = 32, src }: EntityImageProps) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span
        aria-hidden={alt === ""}
        className={styles.imageFallback}
        style={{ blockSize: size, inlineSize: size }}
      >
        {fallback}
      </span>
    );
  }
  return (
    <img
      alt={alt}
      className={styles.entityImage}
      decoding="async"
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      src={src}
      width={size}
    />
  );
}
