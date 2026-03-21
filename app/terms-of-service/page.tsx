import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service - MdPdf",
  description:
    "Read the terms that govern your use of MdPdf, including acceptable use, intellectual property, disclaimers, and limitations of liability.",
  alternates: {
    canonical: "https://mdpdf.net/terms-of-service",
  },
  openGraph: {
    title: "Terms of Service - MdPdf",
    description:
      "Read the terms that govern your use of MdPdf, including acceptable use, intellectual property, disclaimers, and limitations of liability.",
    url: "https://mdpdf.net/terms-of-service",
    siteName: "MdPdf",
    type: "article",
  },
};

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:py-12 md:py-16">
      <nav className="mb-6">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Back to MdPdf
        </Link>
      </nav>

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Terms of Service</h1>
        <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
          Please read these Terms of Service carefully before using MdPdf. By accessing or
          using our website, tools, features, or related services (collectively, the
          "Service"), you agree to be bound by these Terms and our Privacy Policy.
        </p>
        <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
          If you do not agree to these Terms, you must not use MdPdf.
        </p>
      </div>

      <div className="space-y-10 text-sm leading-7 text-gray-700 sm:text-base">
        <section>
          <h2 className="text-xl font-semibold text-gray-900">1. Acceptance of Terms</h2>
          <div className="mt-4 space-y-4">
            <p>
              By using MdPdf, you confirm that you are legally able to enter into this
              agreement and that you will comply with all applicable laws and regulations.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">2. Description of Service</h2>
          <div className="mt-4 space-y-4">
            <p>
              MdPdf provides online tools for converting PDF files into Markdown and for
              preparing Markdown content for export to PDF through the browser.
            </p>
            <p>
              We may update, modify, suspend, or discontinue any part of the Service at any
              time, with or without notice.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">3. Permitted Use</h2>
          <div className="mt-4 space-y-4">
            <p>
              You may use MdPdf only for lawful purposes and in accordance with these Terms.
              You agree not to:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>use the Service in violation of any law or regulation;</li>
              <li>upload or submit content that you do not have the right to process;</li>
              <li>upload malicious code, harmful files, or content intended to disrupt the Service;</li>
              <li>attempt to interfere with, probe, or gain unauthorized access to our systems;</li>
              <li>use automated means to overload, scrape, or abuse the Service;</li>
              <li>use the Service to infringe the rights of others, including intellectual property rights.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">4. Your Content</h2>
          <div className="mt-4 space-y-4">
            <p>
              You retain ownership of the files and content you upload, paste, or generate
              through MdPdf. You are solely responsible for ensuring that you have the right
              to use, process, and convert that content.
            </p>
            <p>
              By using the Service, you grant us the limited rights necessary to process
              your content solely for the purpose of operating and delivering the requested
              functionality.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">5. Intellectual Property</h2>
          <div className="mt-4 space-y-4">
            <p>
              MdPdf, including the website design, branding, software, text, graphics, and
              other materials provided by us, is owned by or licensed to us and is protected
              by applicable intellectual property laws.
            </p>
            <p>
              Except as expressly allowed by law, you may not copy, modify, distribute,
              sell, reverse engineer, or create derivative works from any part of the
              Service without our prior written consent.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">6. Privacy</h2>
          <div className="mt-4 space-y-4">
            <p>
              Your use of MdPdf is also governed by our Privacy Policy, which explains how
              we collect, use, and protect information related to the Service.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">7. No Warranty</h2>
          <div className="mt-4 space-y-4">
            <p>
              The Service is provided on an "as is" and "as available" basis. To the
              fullest extent permitted by law, MdPdf disclaims all warranties, express or
              implied, including warranties of merchantability, fitness for a particular
              purpose, non-infringement, and availability.
            </p>
            <p>
              We do not guarantee that the Service will be uninterrupted, error-free,
              secure, or that conversion results will always be complete, accurate, or fit
              for your specific use case.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">8. Limitation of Liability</h2>
          <div className="mt-4 space-y-4">
            <p>
              To the fullest extent permitted by law, MdPdf and its operators, affiliates,
              service providers, and licensors will not be liable for any indirect,
              incidental, special, consequential, exemplary, or punitive damages, or for any
              loss of data, profits, revenue, business, or goodwill arising out of or in
              connection with your use of, or inability to use, the Service.
            </p>
            <p>
              Where liability cannot be excluded entirely, our total liability will be
              limited to the minimum amount permitted by applicable law.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">9. Third-Party Services and Links</h2>
          <div className="mt-4 space-y-4">
            <p>
              MdPdf may rely on or link to third-party services, tools, or websites. We are
              not responsible for the content, policies, availability, or practices of those
              third parties.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">10. Termination</h2>
          <div className="mt-4 space-y-4">
            <p>
              We may suspend or terminate your access to MdPdf at any time if we believe you
              have violated these Terms, abused the Service, created security risk, or where
              suspension is necessary to protect the platform, users, or third parties.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">11. Changes to These Terms</h2>
          <div className="mt-4 space-y-4">
            <p>
              We may revise these Terms from time to time. Updated versions will become
              effective when posted on this page unless otherwise stated.
            </p>
            <p>
              Your continued use of MdPdf after any update means you accept the revised
              Terms.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">12. Governing Law</h2>
          <div className="mt-4 space-y-4">
            <p>
              These Terms are governed by the laws applicable to the operator of MdPdf,
              without regard to conflict of law principles. The exact governing venue may
              depend on the legal entity or jurisdiction operating the Service.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">13. Contact</h2>
          <div className="mt-4 space-y-4">
            <p>
              If you have questions about these Terms of Service, please contact us through
              the contact method provided on the site.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
