import { Link } from "react-router-dom";
import Logo from "../Logo";

export default function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 border-border">
            <Link to="/" className="inline-block mb-6 origin-left">
              <Logo className="text-[10px]" />
            </Link>
            <p className="text-sm text-muted-foreground font-sans">
              The digital marketplace for creative minds. Buy, sell, and collaborate on premium designs.
            </p>
          </div>
          <div>
            <h3 className="font-sans uppercase tracking-[0.12em] font-black text-white/90 text-sm mb-4">Marketplace</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/marketplace" className="hover:text-foreground">All Services</Link></li>
              <li><Link to="/marketplace?category=vintage" className="hover:text-foreground">Vintage</Link></li>
              <li><Link to="/marketplace?category=minimalist" className="hover:text-foreground">Minimalist</Link></li>
              <li><Link to="/marketplace?category=typography" className="hover:text-foreground">Typography</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-sans uppercase tracking-[0.12em] font-black text-white/90 text-sm mb-4">Services</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/custom-requests" className="hover:text-foreground">Request Design</Link></li>
              <li><Link to="/home/collective" className="hover:text-foreground">Find a Creator</Link></li>
              <li><Link to="/sell" className="hover:text-foreground">Sell Your Work</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-sans uppercase tracking-[0.12em] font-black text-white/90 text-sm mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/faq" className="hover:text-foreground">FAQ</Link></li>
              <li><Link to="/terms" className="hover:text-foreground">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
              <li><Link to="/contact" className="hover:text-foreground">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground font-sans">
            © {new Date().getFullYear()} Club 615 Interactive. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
