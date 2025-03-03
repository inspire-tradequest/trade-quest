
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
} from "lucide-react";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: "AI Recommendations",
      path: "/ai-recommendations",
      icon: <BrainCircuit className="h-5 w-5" />,
      requiresAuth: true,
    },
    {
      name: "Market Analysis",
      path: "/market-analysis",
      icon: <BarChart2 className="h-5 w-5" />,
      requiresAuth: true,
    },
    {
      name: "Risk Assessment",
      path: "/risk-assessment",
      icon: <ShieldAlert className="h-5 w-5" />,
      requiresAuth: true,
    },
    {
      name: "AI Learning",
      path: "/learning",
      icon: <GraduationCap className="h-5 w-5" />,
      requiresAuth: true,
    },
    {
      name: "Simulator",
      path: "/simulator",
      icon: <Briefcase className="h-5 w-5" />,
      requiresAuth: true,
    },
    {
      name: "Strategy Testing",
      path: "/strategy-testing",
      icon: <Sliders className="h-5 w-5" />,
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
