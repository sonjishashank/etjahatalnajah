import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head>
        <link rel="icon" href="/images/Logo.png" />
        <link rel="apple-touch-icon" href="/images/Logo.png" />
        <meta name="theme-color" content="#dc2626" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}