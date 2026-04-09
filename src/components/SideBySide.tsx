'use client';

interface SideBySideProps {
  leftImage: string;
  rightImage: string;
  leftLabel: string;
  rightLabel: string;
}

export function SideBySide({
  leftImage,
  rightImage,
  leftLabel,
  rightLabel,
}: SideBySideProps) {
  return (
    <div className="flex gap-4 w-full">
      <div className="flex-1 space-y-2">
        <div className="aspect-square bg-neutral-100 rounded-lg overflow-hidden">
          <img
            src={leftImage}
            alt={leftLabel}
            className="w-full h-full object-contain"
          />
        </div>
        <p className="text-xs text-neutral-500 text-center">{leftLabel}</p>
      </div>
      <div className="flex-1 space-y-2">
        <div className="aspect-square bg-neutral-100 rounded-lg overflow-hidden">
          <img
            src={rightImage}
            alt={rightLabel}
            className="w-full h-full object-contain"
          />
        </div>
        <p className="text-xs text-neutral-500 text-center">{rightLabel}</p>
      </div>
    </div>
  );
}
