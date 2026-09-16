"use client";

import { useState } from "react";

type FaqItem = {
  question: string;
  answer: string;
};

export default function FaqList({ items }: { items: FaqItem[] }) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {items.map((faq, index) => (
        <div key={faq.question} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <button
            className="flex w-full items-start justify-between gap-4 px-4 py-4 text-start transition-colors hover:bg-gray-50 sm:px-6"
            onClick={() => setOpenFaq(openFaq === index ? null : index)}
          >
            <span className="font-medium text-gray-900">{faq.question}</span>
            <span className="ms-auto shrink-0 text-xl text-gray-400">{openFaq === index ? "−" : "+"}</span>
          </button>
          <div className={openFaq === index ? "px-4 pb-4 text-sm leading-relaxed text-gray-600 sm:px-6" : "hidden"}>
            {faq.answer}
          </div>
        </div>
      ))}
    </div>
  );
}
