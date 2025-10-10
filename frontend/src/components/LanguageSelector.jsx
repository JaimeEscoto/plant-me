import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const LanguageSelector = ({ variant = 'header' }) => {
  const { language, languages, changeLanguage, t } = useLanguage();

  const baseClasses = 'rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-gardenGreen';
  const variants = {
    header: baseClasses + ' bg-white shadow-sm',
    auth: baseClasses + ' bg-slate-50',
  };

  const className = variants[variant] || baseClasses;

  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-600">
      <span className="hidden sm:inline">{t('languageLabel')}</span>
      <select
        value={language}
        onChange={(event) => changeLanguage(event.target.value)}
        className={className}
        aria-label={t('languageLabel')}
      >
        {languages.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
};

export default LanguageSelector;
