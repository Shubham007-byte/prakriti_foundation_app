import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Prakriti Shakti Foundation', description: 'Community work, upcoming events, and ways to get involved with Prakriti Shakti Foundation.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
