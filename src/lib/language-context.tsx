import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'fr' | 'en';

// Le dictionnaire complet pour le header
const translations = {
  fr: {
    home: "Accueil",
    shop: "Boutique",
    about: "À propos",
    contact: "Contact",
    cart: "Panier",
    login: "Se connecter",
    logout: "Se déconnecter",
    myOrders: "Mes commandes",
    greetingMorn: "Bonjour",
    greetingEve: "Bonsoir",
    connectedAs: "Connecté en tant que",
    premiumCereals: "Céréales premium"
  },
  en: {
    home: "Home",
    shop: "Shop",
    about: "About",
    contact: "Contact",
    cart: "Cart",
    login: "Login",
    logout: "Logout",
    myOrders: "My Orders",
    greetingMorn: "Good morning",
    greetingEve: "Good evening",
    connectedAs: "Logged in as",
    premiumCereals: "Premium cereals"
  }
};

type TranslationKey = keyof typeof translations.fr;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Par défaut, le site s'affichera en Français
  const [language, setLanguage] = useState<Language>('fr');

  // Fonction de traduction instantanée
  const t = (key: TranslationKey) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage doit être utilisé à l'intérieur d'un LanguageProvider");
  return context;
}