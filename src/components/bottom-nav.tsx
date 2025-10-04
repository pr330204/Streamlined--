
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageSquare, History, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useUser();

  const navItems = [
    { href: '/', label: 'Home', icon: Home, requireUser: false },
    { href: '/chat', label: 'Chat', icon: MessageSquare, requireUser: true },
  ];

  if (!user) return null;

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-card border-t border-border/40">
      <div className="grid h-full max-w-lg grid-cols-2 mx-auto font-medium">
        {navItems.map((item) => {
          if (item.requireUser && !user) return null;
          const isActive = pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
