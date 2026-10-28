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

export const metadata: Metadata = {
  title: 'Normality of Returns | South African Assets',
  description:
    'Explore the distribution of South African asset returns: price history, return density versus a normal fit, and a normal Q-Q plot.',
  robots: { index: false, follow: false },
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
