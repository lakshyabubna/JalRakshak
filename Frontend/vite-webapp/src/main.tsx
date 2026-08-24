import { StrictMode } from 'react'; import { createRoot } from 'react-dom/client'; import App from './App'; import { LanguageProvider } from './lib/LanguageContext'; import './styles.css'; import './ui-tweaks.css';
createRoot(document.getElementById('root')!).render(<StrictMode><LanguageProvider><App /></LanguageProvider></StrictMode>);
