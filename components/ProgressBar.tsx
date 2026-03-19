import React from "react";
interface Props {
  progress: number; // 0–100
}

export default function ProgressBar({ progress }: Props) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <div
        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
