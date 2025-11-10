import { Card } from '@e2e/watch-build-components';
import ReactDOM from 'react-dom/client';

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  const App = () => (
    <div className="container">
      <main>
        <Card />
      </main>
    </div>
  );

  root.render(<App />);
}
