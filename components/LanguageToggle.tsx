"use client";

import { useState, useEffect } from "react";
import { createContext, useContext } from "react";

// Language context
export const LanguageContext = createContext({
  language: 'en',
  setLanguage: (lang: string) => {},
  t: (key: string) => key
});

export const useLanguage = () => useContext(LanguageContext);

// Language toggle component
export const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' }
  ];

  const currentLang = languages.find(lang => lang.code === language);

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode);
    setIsOpen(false);
    localStorage.setItem('meditrack-language', langCode);
  };

  useEffect(() => {
    const savedLang = localStorage.getItem('meditrack-language');
    if (savedLang) {
      setLanguage(savedLang);
    }
  }, [setLanguage]);

  return (
    <div className="language-toggle">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="language-btn"
        aria-label="Change language"
      >
        <span className="flag">{currentLang?.flag}</span>
        <span className="code">{currentLang?.code.toUpperCase()}</span>
        <svg 
          className={`arrow ${isOpen ? 'open' : ''}`}
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {isOpen && (
        <div className="language-dropdown">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`language-option ${language === lang.code ? 'active' : ''}`}
            >
              <span className="flag">{lang.flag}</span>
              <span className="name">{lang.name}</span>
              {language === lang.code && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        .language-toggle {
          position: relative;
          display: inline-block;
        }

        .language-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(55, 65, 81, 0.2);
          border: 1px solid rgba(75, 85, 99, 0.2);
          border-radius: 12px;
          color: #9CA3AF;
          padding: 8px 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
          font-weight: 500;
          min-width: 80px;
        }

        .language-btn:hover {
          background: rgba(36, 174, 124, 0.1);
          border-color: rgba(36, 174, 124, 0.3);
          color: #24AE7C;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(36, 174, 124, 0.2);
        }

        .flag {
          font-size: 18px;
        }

        .code {
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .arrow {
          transition: transform 0.3s ease;
          color: #9CA3AF;
        }

        .arrow.open {
          transform: rotate(180deg);
        }

        .language-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          background: linear-gradient(135deg, #1F2937 0%, #111827 100%);
          border: 1px solid rgba(55, 65, 81, 0.3);
          border-radius: 12px;
          padding: 8px;
          min-width: 140px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
          z-index: 1000;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .language-option {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 16px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: #9CA3AF;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          text-align: left;
        }

        .language-option:hover {
          background: rgba(36, 174, 124, 0.1);
          color: #24AE7C;
        }

        .language-option.active {
          background: rgba(36, 174, 124, 0.2);
          color: #24AE7C;
          font-weight: 600;
        }

        .language-option .flag {
          font-size: 20px;
        }

        .language-option .name {
          flex: 1;
        }

        .language-option svg {
          color: #24AE7C;
        }
      `}</style>
    </div>
  );
};
