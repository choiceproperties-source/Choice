import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { FavoritesDropdown } from "@/components/favorites-dropdown";
import { useAuth } from "@/lib/auth-context";

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, isLoggedIn } = useAuth();

  const isAdmin = user?.email === 'admin@choiceproperties.com';
  const isLoggedInUser = user && user.email !== 'admin@choiceproperties.com';

  const links = [
    { href: "/", label: "Home" },
    { href: "/properties", label: "Rent" },
    { href: "/buy", label: "Buy" },
    { href: "/sell", label: "Sell" },
    { href: "/property-requirements", label: "Find Home" },
    { href: "/mortgage-calculator", label: "Mortgage" },
    { href: "/agents", label: "Agents" },
    { href: "/faq", label: "FAQ" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
    ...(isLoggedInUser ? [
      { href: "/renter-dashboard", label: "Renter" },
      { href: "/seller-dashboard", label: "Seller" },
      { href: "/buyer-dashboard", label: "Buyer" }
    ] : []),
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
  ];

  const isActive = (path: string) => location === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60" aria-label="Main navigation">
      <div className="container flex h-16 items-center justify-between mx-auto px-4">
        <Link href="/">
          <span className="flex items-center space-x-2 cursor-pointer" aria-label="Choice Properties home">
            <span className="font-heading text-2xl font-bold text-primary">
              Choice<span className="text-secondary">Properties</span>
            </span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-6" role="menubar">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              <span
                className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                  isActive(link.href) ? "text-primary font-bold" : "text-muted-foreground"
                }`}
                role="menuitem"
                aria-current={isActive(link.href) ? "page" : undefined}
              >
                {link.label}
              </span>
            </Link>
          ))}
          <FavoritesDropdown />
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{user?.name}</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={logout}
                className="flex items-center gap-1"
              >
                <LogOut className="h-4 w-4" /> Logout
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-secondary hover:bg-secondary/90 text-primary-foreground font-bold">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col space-y-1 mt-8">
                <p className="text-xs font-semibold text-gray-500 px-4 py-2 uppercase">Navigation</p>
                {links.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <span
                      onClick={() => setIsOpen(false)}
                      className={`px-4 py-3 text-base font-medium transition-colors rounded-lg block cursor-pointer ${
                        isActive(link.href) ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-gray-100"
                      }`}
                    >
                      {link.label}
                    </span>
                  </Link>
                ))}
                <div className="border-t my-2"></div>
                <p className="text-xs font-semibold text-gray-500 px-4 py-2 uppercase">Account</p>
                {isLoggedIn ? (
                  <>
                    <div className="px-4 py-3 text-base font-medium text-gray-700">
                      <UserIcon className="h-4 w-4 inline mr-2" />
                      {user?.name}
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setIsOpen(false);
                      }}
                      className="px-4 py-3 text-base font-medium text-muted-foreground hover:bg-gray-100 rounded-lg w-full text-left flex items-center"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <span
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-3 text-base font-medium text-muted-foreground hover:bg-gray-100 rounded-lg block cursor-pointer"
                      >
                        Login
                      </span>
                    </Link>
                    <Link href="/signup">
                      <Button 
                        className="w-full bg-secondary hover:bg-secondary/90 text-primary-foreground font-bold mt-2"
                        onClick={() => setIsOpen(false)}
                      >
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
