import { useState, useCallback, CSSProperties, ReactNode } from 'react';
import { track, RerenderOverlay } from './rerender-analyzer/index';

interface LabelProps {
  text: string;
  color: string;
}

function Label({ text, color }: LabelProps) {
  return <span style={{ color, fontWeight: 'bold', fontSize: '16px' }}>{text}</span>;
}

interface User {
  name: string;
  role: string;
}

interface UserCardProps {
  user: User;
  onAction: () => void;
}

function UserCard({ user, onAction }: UserCardProps) {
  return (
    <div style={{
      border: '1px solid #ccc',
      borderRadius: '6px',
      padding: '12px',
      marginTop: '8px',
      background: '#fafafa',
    }}>
      <strong>{user.name}</strong> — {user.role}
      <button
        onClick={onAction}
        style={{ marginLeft: '12px', padding: '2px 8px', cursor: 'pointer' }}
      >
        action
      </button>
    </div>
  );
}

interface ContainerProps {
  count: number;
  children: ReactNode;
}

function Container({ count, children }: ContainerProps) {
  return (
    <div style={{
      border: '2px dashed #aaa',
      borderRadius: '8px',
      padding: '16px',
      marginTop: '12px',
    }}>
      <p style={{ margin: '0 0 8px' }}>Container count: {count}</p>
      {children}
    </div>
  );
}

const TrackedLabel = track(Label);
const TrackedUserCard = track(UserCard);
const TrackedContainer = track(Container);

export default function App() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState('Hello');
  const [color, setColor] = useState('#2196f3');

  const unstableUser: User = { name: 'Alice', role: 'Admin' };
  const stableAction = useCallback(() => alert('Stable action!'), []);
  const unstableAction = () => alert('Unstable action!');

  const demoBtn: CSSProperties = {
    padding: '8px 14px',
    cursor: 'pointer',
    borderRadius: '6px',
    border: '1px solid #ccc',
    background: '#f5f5f5',
    fontSize: '13px',
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      <h1>🔍 Rerender Analyzer — Demo</h1>
      <p style={{ color: '#555' }}>
        Нажимайте кнопки и смотрите overlay в правом верхнем углу (или в консоли).
      </p>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <button onClick={() => setCount((c) => c + 1)} style={demoBtn}>
          Increment count ({count})
        </button>
        <button onClick={() => setText((t) => (t === 'Hello' ? 'World' : 'Hello'))} style={demoBtn}>
          Toggle text ("{text}")
        </button>
        <button onClick={() => setColor((c) => (c === '#2196f3' ? '#e91e63' : '#2196f3'))} style={demoBtn}>
          Toggle color
        </button>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <code>&lt;TrackedLabel text color /&gt;</code>
        <br />
        <TrackedLabel text={text} color={color} />
      </div>

      <TrackedContainer count={count}>
        <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#777' }}>
          ⚠ unstableUser — новый объект при каждом рендере:
        </p>
        <TrackedUserCard user={unstableUser} onAction={unstableAction} />

        <p style={{ margin: '8px 0 4px', fontSize: '13px', color: '#777' }}>
          ✅ stableUser + stableAction (useCallback):
        </p>
        <TrackedUserCard user={{ name: 'Bob', role: 'Viewer' }} onAction={stableAction} />
      </TrackedContainer>

      <RerenderOverlay />
    </div>
  );
}
