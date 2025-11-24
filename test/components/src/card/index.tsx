import { messageFromUtils, messageFromUtils2 } from '@e2e/recursive-dev-utils';
import './index.css';

export const Card = () => {
  return (
    <div className="card-comp">
      <h2 id="utils-message">Utils Message: {messageFromUtils}</h2>
      <h2 id="utils-message2">Utils Message2: {messageFromUtils2}</h2>
    </div>
  );
};
