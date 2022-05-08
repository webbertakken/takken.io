import config from '@site/src/core/config'

const { name, title, description, domainUrl, creatorTwitter, themeColor } = config

// noinspection HtmlUnknownTarget
const MetaTags = () => (
  <>
    <meta charSet="utf-8" />
    <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
    {/* viewport meta tag is specified in _app.tsx */}

    {/* general information */}
    <link rel="manifest" href="/static/manifest.json" />
    <meta name="application-name" content={name} />
    <meta name="description" content={description} />
    <meta name="theme-color" content={themeColor} />

    {/* capabilities */}
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content={title} />
    <meta name="format-detection" content="telephone=no" />
    <meta name="mobile-web-app-capable" content="yes" />

    {/* microsoft application */}
    <meta name="msapplication-config" content="/browserconfig.xml" />
    <meta name="msapplication-TileColor" content={themeColor} />
    <meta name="msapplication-tap-highlight" content="no" />

    {/* twitter */}
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:url" content={domainUrl} />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={`${domainUrl}/images/icons/android-chrome-192x192.png`} />
    <meta name="twitter:creator" content={creatorTwitter} />

    {/* open graph */}
    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:site_name" content={name} />
    <meta property="og:url" content={domainUrl} />
    <meta property="og:image" content={`${domainUrl}/images/icons/apple-touch-icon.png`} />
  </>
)

export default MetaTags
