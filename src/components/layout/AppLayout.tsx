import { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Swords, BarChart3, History, User, Home } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { to: '/', icon: Home, label: 'Command' },
  { to: '/stats', icon: BarChart3, label: 'Analytics' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-system-gradient pb-20 lg:pb-0 lg:pl-20">
      {/* Main Content */}
      <main className="min-h-screen">
        {children}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden glass border-t border-border/50 z-50">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all",
                  isActive 
                    ? "text-primary glow-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "animate-pulse")} />
                <span className="text-xs font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Side Navigation (Desktop) */}
      <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-20 flex-col items-center py-6 glass border-r border-border/50 z-50">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary mb-8">
          <Swords className="w-5 h-5 text-primary-foreground" />
        </div>
        
        <div className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl transition-all",
                  isActive 
                    ? "text-primary bg-primary/10 border border-primary/30 glow-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
