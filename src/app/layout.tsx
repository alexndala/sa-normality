import type { Metadata } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';
import './globals.css';

const instrumentSerif = localFont({
  src: '../fonts/InstrumentSerif-Regular.woff2',
  weight: '400',
  style: 'normal',
  variable: '--font-display-next',
  display: 'swap',
});

const roboto = localFont({
  src: '../fonts/Roboto-Variable.woff2',
  weight: '100 900',
  style: 'normal',
  variable: '--font-body-next',
  display: 'swap',
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

const title = 'Normality of Returns | South African Assets';
const description =
  'Explore the distribution of South African asset returns: price history, tail risk, normal and Student-t fits, and a normal Q-Q plot.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  robots: { index: true, follow: true },
  openGraph: {
    title,
    description,
    type: 'website',
    url: siteUrl,
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'SA Normality of Returns dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="en-ZA"
      className={`${instrumentSerif.variable} ${roboto.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
