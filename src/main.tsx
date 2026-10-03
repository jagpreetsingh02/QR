import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Global styles first, so route stylesheets (imported by App's modules) come later in the cascade.
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/figtree';
import '@fontsource-variable/jetbrains-mono';
import './styles/tokens.css';
import './styles/base.css';
import './styles/ui.css';
import App from './App';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root was not found.');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
