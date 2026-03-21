"use client";

import { memo } from "react";

const TEXTAREA_CLASS =
  "min-h-0 w-full flex-1 resize-none rounded-lg border-0 bg-gray-900 p-4 font-mono text-sm text-green-400 outline-none md:min-h-[min(60vh,520px)] md:min-h-0";

/** 仅依赖 markdown，全屏切换时跳过重渲染，减轻超大文本的协调成本 */
const SourceTextarea = memo(
  function SourceTextarea({ markdown }: { markdown: string }) {
    return <textarea readOnly defaultValue={markdown} className={TEXTAREA_CLASS} />;
  },
  (a, b) => a.markdown === b.markdown,
);

export default SourceTextarea;
