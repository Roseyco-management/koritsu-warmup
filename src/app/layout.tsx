import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Koritsu Email Warmup System',
  description: 'Automated email warmup for Koritsu domains',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
