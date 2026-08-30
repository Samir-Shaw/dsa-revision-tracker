import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { practiceApi } from '../services/api.js';

const SOURCES = ['All Problems', 'Due for Revision', 'Never Revised', 'Favorites'];
const COUNTS = [5, 10, 20];

export default function Practice() {
  const [config, setConfig] = useState({ count: 10, difficulty: 'All', source: 'All Problems' });
  const [queue, setQueue] = useState(null);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState('config'); // config | question | rate | summary
  const [results, setResults] = useState([]);

  const start = async () => {
    const res = await practiceApi.random(config);
    if (res.problems.length === 0) {
      alert('No problems match this configuration yet.');
      return;
    }
    setQueue(res.problems);
    setIndex(0);
    setResults([]);
    setPhase('question');
  };

  const currentProblem = queue?.[index];

  const rate = async (result) => {
    await practiceApi.record({ problem_id: currentProblem.id, result });
    setResults([...results, { problem: currentProblem, result }]);
    if (index + 1 < queue.length) {
      setIndex(index + 1);
      setPhase('question');
    } else {
      setPhase('summary');
    }
  };

  if (phase === 'config') {
    return (
      <div style={{ maxWidth: 480 }}>
        <h1>Random Practice</h1>
        <div className="card">
          <Field label="Number of Problems">
            <div style={{ display: 'flex', gap: 8 }}>
              {COUNTS.map((c) => (
                <button key={c} className="btn" style={{ background: config.count === c ? 'var(--surface-hover)' : undefined }} onClick={() => setConfig({ ...config, count: c })}>{c}</button>
              ))}
            </div>
          </Field>
          <Field label="Difficulty">
            <select className="input" value={config.difficulty} onChange={(e) => setConfig({ ...config, difficulty: e.target.value })}>
              {['All', 'Easy', 'Medium', 'Hard'].map((d) => <option key={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Source">
            <select className="input" value={config.source} onChange={(e) => setConfig({ ...config, source: e.target.value })}>
              {SOURCES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={start}>Start Practice</button>
        </div>
      </div>
    );
  }

  if (phase === 'summary') {
    const remembered = results.filter((r) => r.result === 'Remembered').length;
    const partial = results.filter((r) => r.result === 'Partially Remembered').length;
    const forgot = results.filter((r) => r.result === 'Forgot').length;
    const accuracy = Math.round((remembered / results.length) * 100);
    return (
      <div className="card" style={{ maxWidth: 420 }}>
        <h2>Practice Summary</h2>
        <p>Problems: {results.length}</p>
        <ul>
          <li>Remembered: {remembered}</li>
          <li>Partial: {partial}</li>
          <li>Forgot: {forgot}</li>
        </ul>
        <p><strong>Accuracy: {accuracy}%</strong></p>
        <button className="btn btn-primary" onClick={() => setPhase('config')}>Practice Again</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <p style={{ color: 'var(--text-dim)' }}>Problem {index + 1} of {queue.length}</p>
      <div className="card">
        <span style={{ color: 'var(--text-dim)' }}>#{currentProblem.leetcode_number}</span>
        <h2 style={{ margin: '6px 0' }}>{currentProblem.title}</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <span className={`badge badge-${currentProblem.difficulty.toLowerCase()}`}>{currentProblem.difficulty}</span>
          <span style={{ color: 'var(--text-dim)' }}>{currentProblem.primary_pattern}</span>
        </div>
        {currentProblem.leetcode_url && (
          <a href={currentProblem.leetcode_url} target="_blank" rel="noreferrer" className="btn" style={{ marginBottom: 16 }}>
            <ExternalLink size={15} /> Open on LeetCode
          </a>
        )}
        <h4>Did you remember the approach?</h4>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => rate('Remembered')}>Yes</button>
          <button className="btn" onClick={() => rate('Partially Remembered')}>Partially</button>
          <button className="btn" onClick={() => rate('Forgot')}>No</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 13, color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}
