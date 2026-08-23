'use client';

import { useState, useEffect, createContext, useContext } from 'react';

type Language = 'en' | 'gd';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  'home.title': {
    en: 'Find the right debt solution for your situation',
    gd: 'Lorg am fuasgladh fiachan ceart',
  },
  'home.start': {
    en: 'Start your application',
    gd: 'Toisich an tagradh agad',
  },
  'home.before': {
    en: 'Before you start',
    gd: 'Mus toisich thu',
  },
  'home.description': {
    en: 'The Initial Application Advice Service helps you understand which debt solution may be most suitable based on your financial circumstances.',
    gd: 'Tha an t-Seirbheis Comhairle Tagraidh Toisich gad chuideachadh a thuigsinn de am fuasgladh fiachan as fhreagarraiche a reir do shuidheachadh ionmhasail.',
  },
  'home.what': {
    en: 'What this service does',
    gd: 'De ni an t-seirbheis seo',
  },
  'home.solutions': {
    en: 'Available Scottish debt solutions',
    gd: 'Fuasglaidhean fiachan Albannach ri fhaighinn',
  },
  'nav.home': { en: 'Home', gd: 'Dachaigh' },
  'nav.application': { en: 'My Application', gd: 'An Tagradh Agam' },
  'nav.apply': { en: 'Apply', gd: 'Cuir Tagradh' },
  'nav.dashboard': { en: 'Dashboard', gd: 'Deas-bhord' },
  'nav.portal': { en: 'Portal', gd: 'Portal' },
  'nav.statistics': { en: 'Statistics', gd: 'Stadastaireachd' },
  'nav.security': { en: 'Security', gd: 'Tearainteachd' },
  'nav.search': { en: 'Search', gd: 'Lorg' },
  'nav.correspondence': { en: 'Digital Mailroom', gd: 'Seomar-puist Didseatach' },
  'nav.admin': { en: 'Admin', gd: 'Rianachd' },
  'nav.architecture': { en: 'Architecture', gd: 'Ailtireachd' },
  'nav.api-docs': { en: 'API Docs', gd: 'Sgriobh. API' },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('iaas-language') as Language | null;
    if (saved === 'gd') {
      setLanguageState('gd');
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('iaas-language', lang);
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || translations[key]?.en || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-0.5 text-xs">
      <button
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 rounded-l text-white transition-colors min-h-[32px] ${
          language === 'en' ? 'bg-white/20 font-bold' : 'hover:bg-white/10'
        }`}
        title="English"
        aria-label="Switch to English"
      >
        EN
      </button>
      <span className="text-white/50">|</span>
      <button
        onClick={() => setLanguage('gd')}
        className={`px-2 py-1 rounded-r text-white transition-colors min-h-[32px] ${
          language === 'gd' ? 'bg-white/20 font-bold' : 'hover:bg-white/10'
        }`}
        title="Gaidhlig (Scottish Gaelic)"
        aria-label="Switch to Gaelic"
      >
        GD
      </button>
    </div>
  );
}
