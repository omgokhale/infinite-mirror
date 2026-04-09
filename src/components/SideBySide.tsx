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
    <div className="flex gap-4 w-full max-h-[60vh]">
      <div className="flex-1 flex items-center justify-center">
        <img
          src={leftImage}
          alt={leftLabel}
          className="max-w-full max-h-[60vh] object-contain"
        />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <img
          src={rightImage}
          alt={rightLabel}
          className="max-w-full max-h-[60vh] object-contain"
        />
      </div>
    </div>
  );
}
