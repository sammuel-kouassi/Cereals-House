import { Link } from "@tanstack/react-router";
import { Phone, Mail, MapPin } from "lucide-react";
import logo from "@/assets/logo.jpeg";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <img src={logo} alt="" className="h-12 w-12 rounded-full ring-2 ring-gold/50" />
            <div>
              <div className="font-display text-xl font-bold text-gold">Cereals House</div>
              <div className="text-xs uppercase tracking-widest text-primary-foreground/60">Du champ à votre table</div>
            </div>
          </div>
          <p className="mt-4 text-sm text-primary-foreground/70">
            Céréales africaines premium sélectionnées avec soin, livrées partout en Afrique de l'Ouest, en Europe et aux USA.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-widest text-gold">Boutique</h4>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/80">
            <li><Link to="/products" className="hover:text-gold">Tous les produits</Link></li>
            <li><Link to="/cart" className="hover:text-gold">Panier</Link></li>
            <li><Link to="/orders" className="hover:text-gold">Suivi de commande</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-widest text-gold">Entreprise</h4>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/80">
            <li><Link to="/about" className="hover:text-gold">À propos</Link></li>
            <li><Link to="/contact" className="hover:text-gold">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-widest text-gold">Contact</h4>
          <ul className="mt-4 space-y-3 text-sm text-primary-foreground/80">
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-gold" /> +225 05 84 63 72 19</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-gold" /> contact@cerealshouse.com</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold" /> Abidjan, Côte d'Ivoire</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-primary-foreground/60 sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Cereals House. Tous droits réservés.</p>
          <p>Paiements : Orange Money · Wave · MTN · Moov · Visa</p>
        </div>
      </div>
    </footer>
  );
}
