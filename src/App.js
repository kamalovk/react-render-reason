import { useState, useCallback } from 'react';
import { track, RerenderOverlay } from './rerender-analyzer/index.js';

function Label({ text }) {
  return <span>{text}</span>;
}

// unstableUser создаётся заново при каждом рендере → "reference changed"
function UserCard({ user, onAction }) {
  return (
    <div>
      <b>{user.name}</b> ({user.role})
      <button onClick={onAction}>action</button>
    </div>
  );
}

// ререндерится при каждом изменении count → дети получают "parent rerender"
function Container({ count, children }) {
  return (
    <div>
      <p>count: {count}</p>
      {children}
    </div>
  );
}

const TrackedLabel = track(Label);
const TrackedUserCard = track(UserCard);
const TrackedContainer = track(Container);

export default function App() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState('hello');

  const unstableUser = { name: 'Alice', role: 'admin' };
  const stableAction = useCallback(() => {}, []);   // стабильный — useCallback
  const unstableAction = () => {};                  // нестабильный — пересоздаётся

  return (
    <div>
      <h2>rerender-analyzer demo</h2>

      <button onClick={() => setCount((c) => c + 1)}>count: {count}</button>
      <button onClick={() => setText((t) => (t === 'hello' ? 'world' : 'hello'))}>
        text: {text}
      </button>

      <TrackedLabel text={text} />

      <TrackedContainer count={count}>
        <p>unstable user + callback (recreated every render):</p>
        <TrackedUserCard user={unstableUser} onAction={unstableAction} />

        <p>stable callback (useCallback):</p>
        <TrackedUserCard user={{ name: 'Bob', role: 'viewer' }} onAction={stableAction} />
      </TrackedContainer>

      <RerenderOverlay />
    </div>
  );
}
