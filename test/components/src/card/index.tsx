import { add } from '@e2e/recursive-dev-utils';
// import { square } from '@e2e/recursive-dev-utils2';
import './index.css';

export const Card = () => {
  return (
    <div className="card-comp">
      {/* <h2>Card Comp Title: {square(2)}</h2> */}
      <article>{add(1, 2)}</article>
    </div>
  );
};
