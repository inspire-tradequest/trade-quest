
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  LineChart, 
  GraduationCap, 
  Trophy, 
  User,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const Navbar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const routes = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/simulator', label: 'Trade', icon: LineChart },
    { path: '/learn', label: 'Learn', icon: GraduationCap },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out',
        scrolled ? 'py-3 glass-card' : 'py-5 bg-transparent'
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link 
          to="/" 
          className="flex items-center space-x-2 text-2xl font-bold text-trade-blue-600"
        >
          <LineChart className="w-8 h-8" />
          <span className="hidden sm:inline">TradeQuest</span>
        </Link>

        {isMobile ? (
          <>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="block lg:hidden text-gray-700 p-2 rounded-md"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            {isOpen && (
              <div className="fixed inset-0 z-50 bg-white flex flex-col pt-20 pb-6 px-4 animate-fade-in">
                <div className="absolute top-5 right-5">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-700 p-2"
                    aria-label="Close menu"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <nav className="flex flex-col space-y-4">
                  {routes.map((route) => (
                    <Link
                      key={route.path}
                      to={route.path}
                      className={cn(
                        'nav-link flex items-center space-x-3 py-3 px-4 rounded-lg transition-all',
                        location.pathname === route.path 
                          ? 'bg-trade-blue-50 text-trade-blue-600' 
                          : 'hover:bg-gray-50'
                      )}
                    >
                      <route.icon className="w-5 h-5" />
                      <span>{route.label}</span>
                    </Link>
                  ))}
                </nav>
              </div>
            )}
          </>
        ) : (
          <nav className="hidden lg:flex items-center space-x-1">
            {routes.map((route) => (
              <Link
                key={route.path}
                to={route.path}
                className={cn(
                  'nav-link flex items-center space-x-2',
                  location.pathname === route.path && 'active'
                )}
              >
                <route.icon className="w-4 h-4" />
                <span>{route.label}</span>
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
