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
    <header className="sticky top-0 z-50 w-full bg-[#3A5BC7]">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-6">
        <Link href="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
            <FileText className="h-7 w-7 text-white" />
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
              <Check className="h-3 w-3 text-white stroke-[3]" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-white leading-tight" data-testid="text-logo">SaralDocs</span>
            <span className="text-sm text-white/80 leading-tight">Government Document Simplifier</span>
          </div>
        </Link>

        <nav className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="default"
            onClick={handleHomeClick}
            data-testid="link-home"
            className={location === "/" 
              ? "bg-white/20 text-white hover:bg-white/30 hover:text-white text-base px-4 py-2" 
              : "text-white hover:bg-white/10 hover:text-white text-base px-4 py-2"}
          >
            <HomeIcon className="h-5 w-5 mr-2" />
            Home
          </Button>
          {user && (
            <Button
              variant="ghost"
              size="default"
              asChild
              data-testid="link-history"
              className={location === "/history" 
                ? "bg-white/20 text-white hover:bg-white/30 hover:text-white text-base px-4 py-2" 
                : "text-white hover:bg-white/10 hover:text-white text-base px-4 py-2"}
            >
              <Link href="/history">
                <History className="h-5 w-5 mr-2" />
                History
              </Link>
            </Button>
          )}
          
          {!loading && (
            user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="default" className="relative h-12 w-12 rounded-full p-0 hover:bg-white/10">
                    <Avatar className="h-12 w-12 border-2 border-white/30">
                      <AvatarFallback className="bg-white text-[#4169E1] text-base font-bold">
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
                className="text-white hover:bg-white/10 hover:text-white text-base px-4 py-2"
              >
                <Link href="/auth">
                  <LogIn className="h-5 w-5 mr-2" />
                  Login
                </Link>
              </Button>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
