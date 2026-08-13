import * as React from "react"
import { Link, useLocation } from "wouter"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Admin routes don't show the public navbar/footer
  if (location.startsWith('/admin')) {
    return <>{children}</>;
  }

  const isHome = location === '/';
  const navBg = scrolled ? 'bg-secondary py-4 shadow-xl' : (isHome ? 'bg-transparent py-6' : 'bg-secondary py-4');
  const textColor = (scrolled || !isHome) ? 'text-secondary-foreground' : 'text-background';

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <nav className={cn(`fixed w-full z-50 transition-all duration-500`, navBg)}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
          <Link href="/" className="flex items-center cursor-pointer z-50">
            <img
              src="/images/logo-white.png"
              alt="Burnaby Lake Greenhouses"
              className="h-12 md:h-14 w-auto transition-all duration-500"
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-10">
            <Link href="/catalog" className={cn("text-sm font-medium tracking-wide transition-colors hover:text-primary", textColor, "opacity-90")}>Product Catalog</Link>
            <Link href="/history" className={cn("text-sm font-medium tracking-wide transition-colors hover:text-primary", textColor, "opacity-90")}>Our History</Link>
            <Link href="/distribution" className={cn("text-sm font-medium tracking-wide transition-colors hover:text-primary", textColor, "opacity-90")}>Distribution</Link>
            <Link href="/sustainability" className={cn("text-sm font-medium tracking-wide transition-colors hover:text-primary", textColor, "opacity-90")}>Growing Green</Link>
            <Link href="/portal" className={cn("text-sm font-medium tracking-wide transition-colors hover:text-primary", textColor, "opacity-90")}>Customer Portal</Link>
            <Link href="/contact" className="text-sm font-semibold tracking-wider uppercase text-primary hover:text-primary/80 transition-colors border-b border-primary/30 hover:border-primary pb-1">Wholesale Application</Link>
          </div>

          {/* Mobile Nav Toggle */}
          <button 
            className={cn("md:hidden z-50", textColor)}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={cn(
          "fixed inset-0 bg-secondary flex flex-col items-center justify-center gap-8 transition-all duration-500 md:hidden",
          mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        )}>
          <Link href="/" className="text-2xl font-serif text-secondary-foreground hover:text-primary transition-colors">Home</Link>
          <Link href="/catalog" className="text-2xl font-serif text-secondary-foreground hover:text-primary transition-colors">Product Catalog</Link>
          <Link href="/history" className="text-2xl font-serif text-secondary-foreground hover:text-primary transition-colors">Our History</Link>
          <Link href="/distribution" className="text-2xl font-serif text-secondary-foreground hover:text-primary transition-colors">Distribution</Link>
          <Link href="/sustainability" className="text-2xl font-serif text-secondary-foreground hover:text-primary transition-colors">Growing Green</Link>
          <Link href="/portal" className="text-2xl font-serif text-secondary-foreground hover:text-primary transition-colors">Customer Portal</Link>
          <Link href="/contact" className="text-2xl font-serif text-primary mt-4">Wholesale Application</Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="bg-secondary text-secondary-foreground border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="mb-6">
              <img
                src="/images/logo-white.png"
                alt="Burnaby Lake Greenhouses"
                className="h-16 w-auto"
              />
            </div>
            <p className="text-sm text-secondary-foreground/60 max-w-sm">
              Western Canada's leading wholesale greenhouse — growing quality you can stake your reputation on, since 1955.
            </p>
          </div>
          <div>
            <h4 className="font-serif text-lg mb-4 text-background">Navigation</h4>
            <div className="flex flex-col gap-3">
              <Link href="/" className="text-sm text-secondary-foreground/70 hover:text-primary transition-colors">Home</Link>
              <Link href="/catalog" className="text-sm text-secondary-foreground/70 hover:text-primary transition-colors">Product Catalog</Link>
              <Link href="/history" className="text-sm text-secondary-foreground/70 hover:text-primary transition-colors">Our History</Link>
              <Link href="/distribution" className="text-sm text-secondary-foreground/70 hover:text-primary transition-colors">Distribution</Link>
              <Link href="/sustainability" className="text-sm text-secondary-foreground/70 hover:text-primary transition-colors">Growing Green</Link>
              <Link href="/portal" className="text-sm text-secondary-foreground/70 hover:text-primary transition-colors">Customer Portal</Link>
              <Link href="/contact" className="text-sm text-secondary-foreground/70 hover:text-primary transition-colors">Apply for Account</Link>
            </div>
          </div>
          <div>
            <h4 className="font-serif text-lg mb-4 text-background">Contact</h4>
            <div className="flex flex-col gap-3 text-sm text-secondary-foreground/70">
              <p>Surrey, British Columbia</p>
              <p>Wholesale only.</p>
              <p>Pickups by appointment.</p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-12 mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-secondary-foreground/50">
            &copy; {new Date().getFullYear()} Burnaby Lake Greenhouses Ltd. All rights reserved.
          </p>
          <p className="text-xs text-secondary-foreground/50">
            <Link href="/admin/login" className="hover:text-secondary-foreground transition-colors">Staff Login</Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
