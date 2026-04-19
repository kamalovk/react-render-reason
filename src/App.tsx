import { useState, useCallback, ReactNode } from 'react';
import './App.css';
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
    <div className="demo-user-card">
      <strong>{user.name}</strong> - {user.role}
      <button className="demo-user-card__action" onClick={onAction}>action</button>
    </div>
  );
}

interface ContainerProps {
  count: number;
  children: ReactNode;
}

function Container({ count, children }: ContainerProps) {
  return (
    <div className="demo-container">
      <p className="demo-container__count">Container count: {count}</p>
      {children}
    </div>
  );
}

function SlowComponent({ value }: { value: number }) {
  const start = performance.now();
  while (performance.now() - start < 25) { /* spin */ }
  return (
    <div className="demo-slow">
      SlowComponent value: <strong>{value}</strong>
    </div>
  );
}

// в”Ђв”Ђв”Ђ Prop-diff demo components в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ

interface CounterDisplayProps {
  count: number;
  label: string;
}
function CounterDisplay({ count, label }: CounterDisplayProps) {
  return (
    <div className="demo-counter">
      {label}: <strong>{count}</strong>
    </div>
  );
}

interface ProfileCardProps {
  profile: { name: string; age: number };
  theme: string;
}
function ProfileCard({ profile, theme }: ProfileCardProps) {
  return (
    <div
      className="demo-profile-card"
      style={{
        background: theme === 'dark' ? '#1a1a1a' : '#f5f5f5',
        color: theme === 'dark' ? '#e0e0e0' : '#222',
      }}
    >
      {profile.name}, {profile.age} y.o. - theme: {theme}
    </div>
  );
}

interface ActionButtonProps {
  label: string;
  onClick: () => void;
}
function ActionButton({ label, onClick }: ActionButtonProps) {
  return (
    <button className="demo-action-btn" onClick={onClick}>{label}</button>
  );
}

// в”Ђв”Ђв”Ђ Tracked versions в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ

const TrackedLabel = track(Label);
const TrackedUserCard = track(UserCard);
const TrackedContainer = track(Container);
const TrackedSlowComponent = track(SlowComponent);
const TrackedCounterDisplay = track(CounterDisplay);
const TrackedProfileCard = track(ProfileCard);
const TrackedActionButton = track(ActionButton);

// в”Ђв”Ђв”Ђ App в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ

export default function App() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState('Hello');
  const [color, setColor] = useState('#2196f3');
  const [age, setAge] = useState(25);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const unstableUser: User = { name: 'Alice', role: 'Admin' };
  const stableAction = useCallback(() => alert('Stable action!'), []);
  const unstableAction = () => alert('Unstable action!');
  const unstableProfile = { name: 'Alice', age };

  return (
    <div className="demo-app">
      <h1>Rerender Analyzer - Demo</h1>
      <p className="demo-subtitle">
        Click buttons and watch the overlay (or console). The Log tab shows <strong>prev &rarr; next</strong> for each changed prop.
      </p>

      {/* в”Ђв”Ђ Controls в”Ђв”Ђ */}
      <div className="demo-controls">
        <button className="demo-btn" onClick={() => setCount((c) => c + 1)}>count + ({count})</button>
        <button className="demo-btn" onClick={() => setText((t) => (t === 'Hello' ? 'World' : 'Hello'))}>toggle text ("{text}")</button>
        <button className="demo-btn" onClick={() => setColor((c) => (c === '#2196f3' ? '#e91e63' : '#2196f3'))}>toggle color</button>
        <button className="demo-btn" onClick={() => setAge((a) => a + 1)}>age + ({age})</button>
        <button className="demo-btn" onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}>toggle theme ({theme})</button>
      </div>

      {/* в”Ђв”Ђ 1. Primitive props в”Ђв”Ђ */}
      <div className="demo-section">
        <p className="demo-section-title">1. Primitive props - number &amp; string</p>
        <p className="demo-hint">Click "count +" or "toggle text" to see exact prev &rarr; next values in the Log tab.</p>
        <TrackedCounterDisplay count={count} label={text} />
        <TrackedLabel text={text} color={color} />
      </div>

      {/* в”Ђв”Ђ 2. Object props в”Ђв”Ђ */}
      <div className="demo-section">
        <p className="demo-section-title">2. Object props - unstable vs stable reference</p>
        <p className="demo-hint">
          <strong>unstableProfile</strong> - new object on every render, even when data is identical.
          Click "count +" and ProfileCard will think the profile changed.
        </p>
        <TrackedProfileCard profile={unstableProfile} theme={theme} />
        <p className="demo-hint-sm"><strong>unstableUser</strong> - same issue:</p>
        <TrackedUserCard user={unstableUser} onAction={unstableAction} />
      </div>

      {/* в”Ђв”Ђ 3. Function props в”Ђв”Ђ */}
      <div className="demo-section">
        <p className="demo-section-title">3. Function props - stable (useCallback) vs recreated</p>
        <p className="demo-hint"><strong>stableAction</strong> (useCallback) - same function reference, no extra re-renders.</p>
        <TrackedActionButton label="Stable action" onClick={stableAction} />
        <p className="demo-hint-sm"><strong>unstableAction</strong> - new function every render:</p>
        <TrackedActionButton label="Unstable action" onClick={unstableAction} />
      </div>

      {/* в”Ђв”Ђ 4. Parent rerender propagation в”Ђв”Ђ */}
      <TrackedContainer count={count}>
        <p className="demo-hint">Components inside Container re-render on any parent state change.</p>
        <TrackedUserCard user={{ name: 'Bob', role: 'Viewer' }} onAction={stableAction} />
      </TrackedContainer>

      {/* в”Ђв”Ђ 5. Slow render в”Ђв”Ђ */}
      <div className="demo-section">
        <p className="demo-section-title">5. Slow render (~25ms busy-loop)</p>
        <p className="demo-hint">Click "count +" - SlowComponent will show a red duration badge in the overlay.</p>
        <TrackedSlowComponent value={count} />
      </div>

      <RerenderOverlay />
    </div>
  );
}
