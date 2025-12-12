import { FileText, History, Home as HomeIcon, LogOut, LogIn, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
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
  const { user, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setLocation("/");
  };

  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  const handleHomeClick = () => {
    setLocation("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#3A5BC7] overflow-hidden">
      <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6">
        <Link href="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="relative flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-white/20 flex-shrink-0">
            <FileText className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            <div className="absolute -bottom-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-green-500">
              <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white stroke-[3]" />
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-base sm:text-xl font-bold text-white leading-tight truncate" data-testid="text-logo">SaralDocs</span>
            <span className="text-xs sm:text-sm text-white/80 leading-tight hidden xs:block">Government Document Simplifier</span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-4 flex-shrink-0">
          <Button
            variant="ghost"
            size="default"
            onClick={handleHomeClick}
            data-testid="link-home"
            className={location === "/" 
              ? "bg-white/20 text-white hover:bg-white/30 hover:text-white text-sm sm:text-base px-2 sm:px-4 py-2" 
              : "text-white hover:bg-white/10 hover:text-white text-sm sm:text-base px-2 sm:px-4 py-2"}
          >
            <HomeIcon className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline">Home</span>
          </Button>
          {user && (
            <Button
              variant="ghost"
              size="default"
              asChild
              data-testid="link-history"
              className={location === "/history" 
                ? "bg-white/20 text-white hover:bg-white/30 hover:text-white text-sm sm:text-base px-2 sm:px-4 py-2" 
                : "text-white hover:bg-white/10 hover:text-white text-sm sm:text-base px-2 sm:px-4 py-2"}
            >
              <Link href="/history">
                <History className="h-5 w-5 sm:mr-2" />
                <span className="hidden sm:inline">History</span>
              </Link>
            </Button>
          )}
          
          {!loading && (
            user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="default" className="relative h-9 w-9 sm:h-12 sm:w-12 rounded-full p-0 hover:bg-white/10">
                    <Avatar className="h-9 w-9 sm:h-12 sm:w-12 border-2 border-white/30">
                      <AvatarFallback className="bg-white text-[#4169E1] text-sm sm:text-base font-bold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-[#4169E1] text-white text-xs">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-sm font-medium">{user.email}</p>
                      <p className="text-xs text-muted-foreground">Signed in</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-500 focus:text-red-500">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="default"
                asChild
                className="text-white hover:bg-white/10 hover:text-white text-sm sm:text-base px-2 sm:px-4 py-2"
              >
                <Link href="/auth">
                  <LogIn className="h-5 w-5 sm:mr-2" />
                  <span className="hidden sm:inline">Login</span>
                </Link>
              </Button>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
