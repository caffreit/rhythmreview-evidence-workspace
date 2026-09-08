import type { Metadata } from 'next';
import { Archivo, IBM_Plex_Mono, Inter } from 'next/font/google';
import './globals.css';

const archivo = Archivo({ variable: '--font-display', subsets: ['latin'] });
const inter = Inter({ variable: '--font-body', subsets: ['latin'] });
const mono = IBM_Plex_Mono({ variable: '--font-mono', subsets: ['latin'], weight: ['400', '500'] });

export const metadata: Metadata = {
  title: 'RhythmReview Evidence Workspace | Blue Bridge',
  description: 'A fictional SaMD evidence-coherence and change-impact evaluation workspace.',
  metadataBase: new URL('https://rhythmreview-evidence-workspace.basic-crown-9822.chatgpt.site'),
  openGraph: {
    title: 'RhythmReview Evidence Workspace',
    description: 'Change impact. Traceable evidence. Human approval.',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RhythmReview Evidence Workspace',
    description: 'Change impact. Traceable evidence. Human approval.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${archivo.variable} ${inter.variable} ${mono.variable}`}>{children}</body></html>;
}
