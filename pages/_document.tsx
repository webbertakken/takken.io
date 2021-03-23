import Document, { Html, Head, Main, NextScript } from 'next/document'
import MetaTags from '../components/meta/MetaTags'
import MetaIcons from '../components/meta/MetaIcons'

class CustomDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render() {
    return (
      <Html>
        <Head>
          <MetaTags />
          <MetaIcons />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default CustomDocument
