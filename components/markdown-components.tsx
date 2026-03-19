import React from "react";
import type { Components } from "react-markdown";

export const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="mb-4 text-3xl font-bold text-gray-900">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-6 mb-3 text-2xl font-semibold text-gray-900">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-4 mb-2 text-xl font-semibold text-gray-900">{children}</h3>,
  p: ({ children }) => <p className="mb-3 leading-7 text-gray-800">{children}</p>,
  ul: ({ children }) => <ul className="mb-4 list-disc space-y-1.5 pl-6 text-gray-800">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 list-decimal space-y-1.5 pl-6 text-gray-800">{children}</ol>,
  li: ({ children }) => <li className="leading-7">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 rounded-r border-l-4 border-gray-300 bg-gray-50 py-2 pl-4 text-gray-600 italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-5 border-gray-300" />,
  code: ({ children, className }) => {
    const isBlock = Boolean(className);
    if (!isBlock) {
      return (
        <code className="rounded bg-gray-200 px-1.5 py-0.5 font-mono text-sm text-gray-900">
          {children}
        </code>
      );
    }

    const language = className?.replace(/^language-/, "").toUpperCase();
    return (
      <div className="mb-4">
        {language ? (
          <div className="mb-1 text-[11px] font-semibold tracking-wide text-gray-500">{language}</div>
        ) : null}
        <code className="block overflow-x-auto rounded-lg bg-gray-900 p-4 font-mono text-sm leading-6 text-gray-100">
          {children}
        </code>
      </div>
    );
  },
  pre: ({ children }) => <pre className="mb-0">{children}</pre>,
  table: ({ children }) => (
    <div className="mb-4 overflow-x-auto">
      <table className="w-full border border-gray-300 text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-gray-100">{children}</thead>,
  th: ({ children }) => <th className="border border-gray-300 px-3 py-2 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="border border-gray-300 px-3 py-2">{children}</td>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-700">
      {children}
    </a>
  ),
};
