import Layout from '@theme/Layout'
import React from 'react'

const Privacy = (): React.ReactElement => {
  return (
    <Layout title="Privacy policy" description="How takken.io handles your data">
      <div className="min-h-screen p-8 md:p-16">
        <div className="mx-auto max-w-3xl">
          <header className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Privacy policy</h1>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
              A plain-English overview of what we collect and why.
            </p>
          </header>

          <div className="space-y-10 text-gray-700 dark:text-gray-300">
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
                What we collect
              </h2>
              <ul className="list-inside list-disc space-y-3">
                <li>
                  <strong>Analytics</strong> &mdash; We use Google Analytics, loaded through Google
                  Tag Manager, to understand how the site is used. This includes pages visited, time
                  on site, and general device/browser info. We do not track any personally
                  identifiable information (PII) through analytics. Analytics only load after you
                  accept cookies.
                </li>
                <li>
                  <strong>Search</strong> &mdash; We use Algolia for site search. Search queries are
                  sent to Algolia.
                </li>
                <li>
                  <strong>Cookies</strong> &mdash; We use cookies for preferences. Google Analytics
                  may set analytics cookies.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
                How we use it
              </h2>
              <ul className="list-inside list-disc space-y-2">
                <li>To understand which content is popular and improve the site</li>
                <li>We never sell your data</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
                Your rights
              </h2>
              <p className="mb-3">Under GDPR and CCPA you can:</p>
              <ul className="list-inside list-disc space-y-2">
                <li>Request a copy of your data</li>
                <li>Request deletion of your data</li>
                <li>
                  California residents have additional rights under the CCPA including the right to
                  know, delete, and opt out of data sales (we do not sell data)
                </li>
              </ul>
              <p className="mt-4">
                Contact us at{' '}
                <a
                  href="mailto:privacy@takken.io"
                  className="font-medium text-pink underline hover:text-pink-dark"
                >
                  privacy@takken.io
                </a>
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
                Third parties
              </h2>
              <ul className="list-inside list-disc space-y-2">
                <li>
                  <strong>Google Analytics (Google)</strong> &mdash; analytics
                </li>
                <li>
                  <strong>Google Tag Manager (Google)</strong> &mdash; tag management
                </li>
                <li>
                  <strong>Algolia</strong> &mdash; search
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">Changes</h2>
              <p>We may update this policy. Last updated: October 2026.</p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Privacy
