import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StudyBuddy – Chat with your documents',
  description: 'Upload any document and ask questions using AI.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
