import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  BarChart2,
  BrainCircuit,
  LightbulbIcon,
  LayoutDashboard,
  Menu,
  TrendingUp,
  User,
  ShieldAlert,
  GraduationCap,
  Briefcase,
  Sliders,
  X,
  HomeIcon,
  SparklesIcon,
  ShieldAlertIcon,
  BarChart3Icon,
  BrainCircuitIcon,
  GraduationCapIcon,
  TimerResetIcon,
} from "lucide-react";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    {
      name: 'Home',
      path: '/',
      icon: <HomeIcon className="h-4 w-4" />,
    },
    {
      name: 'AI Recommendations',
      path: '/recommendations',
      icon: <SparklesIcon className="h-4 w-4" />,
      requiresAuth: true,
    },
    {
      name: 'Risk Assessment',
      path: '/risk-assessment',
      icon: <ShieldAlertIcon className="h-4 w-4" />,
      requiresAuth: true,
    },
    {
      name: 'Market Analysis',
      path: '/market-analysis',
      icon: <BarChart3Icon className="h-4 w-4" />,
      requiresAuth: true,
    },
    {
      name: 'Trading Strategies',
      path: '/strategy-testing',
      icon: <BrainCircuitIcon className="h-4 w-4" />,
      requiresAuth: true,
    },
    {
      name: 'Learning Center',
      path: '/learn',
      icon: <GraduationCapIcon className="h-4 w-4" />,
      requiresAuth: true,
    },
    {
      name: 'Simulator',
      path: '/simulator',
      icon: <TimerResetIcon className="h-4 w-4" />,
      requiresAuth: true,
    },
  ];

  const visibleNavItems = navItems.filter(
    (item) => !item.requiresAuth || user
  );

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="border-b bg-background shadow-sm sticky top-0 z-50">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="flex w-full justify-between items-center">
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center gap-2 font-semibold text-lg"
            >
              <LightbulbIcon className="h-5 w-5 text-primary" />
              <span>TradingAI</span>
            </Link>

            {/* Desktop navigation */}
            <div className="hidden md:flex ml-10 gap-1">
              {visibleNavItems.map((item) => (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive(item.path) ? "default" : "ghost"}
                    size="sm"
                    className="gap-2"
                  >
                    {item.icon}
                    <span className="hidden lg:inline-block">
                      {item.name}
                    </span>
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <Link to="/profile">
                <Button
                  variant={isActive("/profile") ? "default" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <User className="h-5 w-5" />
                  <span className="hidden sm:inline-block">Profile</span>
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button size="sm" className="gap-2">
                  Sign In
                </Button>
              </Link>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleMobileMenu}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden p-4 border-t space-y-2 bg-background">
          {visibleNavItems.map((item) => (
            <Link key={item.path} to={item.path} onClick={toggleMobileMenu}>
              <Button
                variant={isActive(item.path) ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start gap-2"
              >
                {item.icon}
                {item.name}
              </Button>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
