import { ReactNode } from 'react';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen gradient-dark">
      <Navbar />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}
