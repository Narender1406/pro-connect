// src/components/ui/Skeleton.tsx
import "./Skeleton.css";

type Props = {
  height?: number;
  width?: string;
};

export default function Skeleton({ height = 16, width = "100%" }: Props) {
  return (
    <div
      className="skeleton"
      style={{ height, width }}
    />
  );
}
