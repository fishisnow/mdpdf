import React from "react";
export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-sm">
            <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">
              Privacy Policy
            </a>
            <span className="text-gray-300">•</span>
            <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">
              Terms of Service
            </a>
          </div>
          <p className="text-sm text-gray-400">
            © 2026 MdPdf. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}