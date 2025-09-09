import { Link, useLocation } from 'react-router-dom';
import { Trophy, Camera, Home } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { to: '/', icon: Home, label: 'Compare' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/submit', icon: Camera, label: 'Submit Photo' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              FaceMash
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  location.pathname === to
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;