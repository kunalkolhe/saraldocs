import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, LogOut, User, Loader2, Menu, X, Home, History } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Header() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading, logout, isLoggingOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setLocation("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    ...(isAuthenticated ? [{ href: "/history", label: "History", icon: History }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top Bar - Government Style */}
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto flex items-center justify-between px-4 md:px-6 py-3">
          <Link href="/" className="flex items-center gap-3">
            <Logo className="h-10 w-10 md:h-12 md:w-12" />
            <div className="flex flex-col">
              <span className="text-lg md:text-xl font-bold tracking-tight">SaralDocs</span>
              <span className="text-xs md:text-sm opacity-80 hidden sm:block">Government Document Simplifier</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex items-center gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant="ghost"
                    className={`text-primary-foreground hover:bg-white/10 gap-2 ${
                      location === link.href ? "bg-white/20" : ""
                    }`}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Button>
                </Link>
              ))}
            </nav>

            {/* Auth Section */}
            {isLoading ? (
              <Button variant="ghost" size="icon" disabled className="text-primary-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </Button>
            ) : isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 text-primary-foreground hover:bg-white/10">
                    <Avatar className="h-8 w-8 border-2 border-white/30">
                      <AvatarFallback className="text-sm bg-white/20 text-primary-foreground">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="max-w-[120px] truncate hidden lg:inline">
                      {user.name}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    disabled={isLoggingOut}
                    className="text-destructive focus:text-destructive"
                  >
                    {isLoggingOut ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="mr-2 h-4 w-4" />
                    )}
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button className="bg-white text-primary hover:bg-gray-100 gap-2 font-semibold">
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-primary-foreground hover:bg-white/10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-primary/95 text-primary-foreground border-t border-white/10">
          <div className="container mx-auto px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-primary-foreground hover:bg-white/10 gap-3 text-lg py-6 ${
                    location === link.href ? "bg-white/20" : ""
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </Button>
              </Link>
            ))}
            
            <div className="border-t border-white/10 pt-4 mt-4">
              {isAuthenticated && user ? (
                <div className="space-y-2">
                  <div className="px-4 py-2 text-sm opacity-80">
                    Logged in as: {user.name}
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-primary-foreground hover:bg-white/10 gap-3 text-lg py-6"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    disabled={isLoggingOut}
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </Button>
                </div>
              ) : (
                <Link href="/login">
                  <Button
                    className="w-full bg-white text-primary hover:bg-gray-100 gap-3 text-lg py-6 font-semibold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LogIn className="h-5 w-5" />
                    Login / Register
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
