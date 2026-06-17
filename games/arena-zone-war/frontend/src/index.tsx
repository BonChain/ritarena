import { render } from 'preact';
import { App } from './components/App';
import './styles.css';

const appEl = document.querySelector<HTMLDivElement>('#app');
if (!appEl) {
  throw new Error('Missing #app root');
}

render(<App />, appEl);