import React from 'react';

/*
  Simple tile:    <StatCard label="Draft" value={3} color="var(--warn)" />
  With bar:       <StatCard label="% Sent" value="25%" barPct={25} />
  Breakdown tile: <StatCard label="Sent by Department" breakdown={[{name,s,t}]}
                            selectedName="Sales" onPick={name => ...} />
*/
export default function StatCard({ label, value, color, barPct, breakdown, selectedName, onPick }) {
  if (breakdown) {
    return (
      <div className="tile brk">
        <h3>{label}</h3>
        <div className="list">
          {breakdown.map(({ name, s, t }) => (
            <div
              key={name}
              className={`brow${selectedName === name ? ' on' : ''}`}
              title="Click to filter the grid"
              onClick={() => onPick(name)}
            >
              <span>{name}</span>
              <span className="n">
                <b>{s}</b> / {t}
              </span>
              <span className="pb">
                <i style={{ width: `${t ? (s / t) * 100 : 0}%` }} />
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="tile">
      <span>{label}</span>
      <b style={color ? { color } : undefined}>{value}</b>
      {barPct !== undefined && (
        <div className="bar">
          <i style={{ width: `${barPct}%` }} />
        </div>
      )}
    </div>
  );
}