import { createRoot } from 'react-dom/client'; import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; import App from './App'; import './styles.css';
import { ErrorBoundary } from './components/ErrorBoundary';
createRoot(document.getElementById('root')!).render(<ErrorBoundary><BrowserRouter><AuthProvider><App /></AuthProvider></BrowserRouter></ErrorBoundary>);
