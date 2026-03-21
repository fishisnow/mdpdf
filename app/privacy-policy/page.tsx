import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy - MdPdf",
  description:
    "Read how MdPdf handles uploaded files, analytics data, cookies, and other information across our PDF to Markdown and Markdown to PDF tools.",
  alternates: {
    canonical: "https://mdpdf.net/privacy-policy",
  },
  openGraph: {
    title: "Privacy Policy - MdPdf",
    description:
      "Read how MdPdf handles uploaded files, analytics data, cookies, and other information across our PDF to Markdown and Markdown to PDF tools.",
    url: "https://mdpdf.net/privacy-policy",
    siteName: "MdPdf",
    type: "article",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:py-12 md:py-16">
      <nav className="mb-6">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Back to MdPdf
        </Link>
      </nav>

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Privacy Policy</h1>
        <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
          This Privacy Policy explains how MdPdf ("MdPdf", "we", "us", or "our")
          collects, uses, and protects information when you use our website and tools,
          including our PDF to Markdown and Markdown to PDF features.
        </p>
        <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
          By using MdPdf, you agree to the practices described in this policy. If you do
          not agree, please do not use the site.
        </p>
      </div>

      <div className="space-y-10 text-sm leading-7 text-gray-700 sm:text-base">
        <section>
          <h2 className="text-xl font-semibold text-gray-900">1. Information We Collect</h2>
          <div className="mt-4 space-y-4">
            <p>
              We collect limited information needed to operate MdPdf, improve the site,
              understand usage patterns, and protect the service.
            </p>
            <p>
              <strong>Files you upload for conversion.</strong> When you use our PDF to
              Markdown tool, you may upload PDF files so we can process them and return
              converted Markdown output.
            </p>
            <p>
              <strong>Content you enter in the browser.</strong> When you use our Markdown
              to PDF tool, the Markdown content you type or paste stays in your browser for
              the print workflow.
            </p>
            <p>
              <strong>Usage and device information.</strong> We may collect technical data
              such as IP address, browser type, operating system, referring pages, pages
              viewed, timestamps, approximate location derived from IP, and general usage
              events on the site.
            </p>
            <p>
              <strong>Analytics information.</strong> We use analytics tools, including
              Google Analytics, to understand how visitors use MdPdf, which pages are most
              useful, and where we can improve the user experience.
            </p>
            <p>
              <strong>Cookies and similar technologies.</strong> We may use cookies or
              similar technologies to remember preferences, measure traffic, and improve
              site functionality.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">2. How We Use Information</h2>
          <div className="mt-4 space-y-4">
            <p>We use collected information to:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>provide and operate the MdPdf website and tools;</li>
              <li>process uploaded PDF files and return conversion results;</li>
              <li>monitor performance, diagnose errors, and improve reliability;</li>
              <li>analyze traffic and feature usage;</li>
              <li>prevent abuse, fraud, security incidents, and misuse of the service;</li>
              <li>comply with legal obligations when required.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">3. File Handling</h2>
          <div className="mt-4 space-y-4">
            <p>
              MdPdf is designed to minimize retention of uploaded content. For the PDF to
              Markdown tool, uploaded files are processed for conversion and are not stored
              longer than necessary to complete the request.
            </p>
            <p>
              The Markdown to PDF feature runs in the browser print workflow, which means
              the Markdown content you write or paste for that feature is processed on the
              client side as part of the browser experience.
            </p>
            <p>
              Even though we aim to keep file handling minimal, no system can be guaranteed
              to be 100% secure. Please avoid uploading highly sensitive files unless you
              are comfortable with the associated risks of internet-based services.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">4. Cookies and Analytics</h2>
          <div className="mt-4 space-y-4">
            <p>
              We may use cookies, analytics tags, and similar technologies to understand
              site usage, maintain performance, and improve content and product decisions.
            </p>
            <p>
              These technologies may collect information such as browser type, device type,
              session activity, and interactions with pages and features. Third-party
              analytics providers may also receive this information according to their own
              privacy policies.
            </p>
            <p>
              You can usually manage cookies through your browser settings. Blocking some
              cookies may affect how the site works.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">5. How We Share Information</h2>
          <div className="mt-4 space-y-4">
            <p>We do not sell your personal information. We may share information:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>with service providers that help us host, operate, analyze, or secure the site;</li>
              <li>with analytics vendors that help us understand traffic and performance;</li>
              <li>if required by law, regulation, legal process, or valid government request;</li>
              <li>to protect the rights, safety, and security of MdPdf, our users, or others;</li>
              <li>as part of a merger, acquisition, financing, or asset transfer.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">6. Data Retention</h2>
          <div className="mt-4 space-y-4">
            <p>
              We retain information only for as long as reasonably necessary for the
              purposes described in this policy, including operating the service,
              troubleshooting issues, complying with legal obligations, and resolving
              disputes.
            </p>
            <p>
              Technical logs and analytics data may be retained for a longer period where
              necessary for security, fraud prevention, and service improvement.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">7. International Data Transfers</h2>
          <div className="mt-4 space-y-4">
            <p>
              MdPdf may use infrastructure and service providers located in different
              countries. As a result, your information may be processed or stored outside
              your country of residence.
            </p>
            <p>
              Where applicable, we take reasonable steps to ensure appropriate safeguards
              are in place for these transfers.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">8. Your Choices</h2>
          <div className="mt-4 space-y-4">
            <p>You may have choices regarding how your information is used, including:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>adjusting your browser settings to block or remove cookies;</li>
              <li>using browser tools or extensions that limit analytics or tracking;</li>
              <li>choosing not to upload files you do not want processed online.</li>
            </ul>
            <p>
              Depending on where you live, you may also have legal rights to access,
              correct, delete, or restrict certain personal information.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">9. Security</h2>
          <div className="mt-4 space-y-4">
            <p>
              We use reasonable administrative, technical, and organizational measures to
              help protect information against unauthorized access, disclosure, alteration,
              or destruction.
            </p>
            <p>
              However, no website, network, or online service can be guaranteed completely
              secure. You use MdPdf at your own risk.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">10. Children's Privacy</h2>
          <div className="mt-4 space-y-4">
            <p>
              MdPdf is not intended for children, and we do not knowingly collect personal
              information from children under the age required by applicable law. If you
              believe a child has provided personal information through the site, please
              contact us so we can review and address the issue.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">11. Changes to This Policy</h2>
          <div className="mt-4 space-y-4">
            <p>
              We may update this Privacy Policy from time to time. If we make changes, we
              will post the revised version on this page and update the effective date if
              needed.
            </p>
            <p>
              Your continued use of MdPdf after an update means you accept the revised
              policy.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">12. Contact</h2>
          <div className="mt-4 space-y-4">
            <p>
              If you have questions about this Privacy Policy or how MdPdf handles data,
              please contact us through the contact method you provide on the site.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
