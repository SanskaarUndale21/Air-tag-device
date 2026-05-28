'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/history', label: 'History' },
  { href: '/settings', label: 'Settings' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header style={{ background: '#0a1525', borderBottom: '1px solid #162748' }}>
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-widest" style={{ color: '#00e5a0', fontFamily: 'var(--font-space-mono)' }}>
            FINDIT
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(0,229,160,0.1)', color: '#00e5a0', border: '1px solid rgba(0,229,160,0.2)' }}>
            GPS TRACKER
          </span>
        </div>

        <nav className="flex items-center gap-1">
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
                style={{
                  color: active ? '#00e5a0' : '#8899aa',
                  background: active ? 'rgba(0,229,160,0.08)' : 'transparent',
                  border: active ? '1px solid rgba(0,229,160,0.2)' : '1px solid transparent',
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
