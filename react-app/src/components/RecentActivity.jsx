import React, { useState } from 'react';

export default function RecentActivity({ audit, onExport }) {
  const [action, setAction] = useState('');
  const [q, setQ] = useState('');

  const query = q.toLowerCase();
  const rows = audit
    .filter(
      (a) =>
        (!action || a.action === action) &&
        (!query || Object.values(a).join(' ').toLowerCase().includes(query))
    )
    .slice()
    .reverse();

  return (
    <section className="card audit">
      <div className="card-head">
        <h2>Audit Trail</h2>
        <div className="tools">
          <select className="sm" value={action} onChange={(ev) => setAction(ev.target.value)}>
            <option value="">All actions</option>
            <option>Reviewed</option>
            <option>Sent</option>
            <option>Exported</option>
          </select>
          <input
            className="search"
            type="text"
            placeholder="Search audit…"
            value={q}
            onChange={(ev) => setQ(ev.target.value)}
          />
          <button className="btn" onClick={onExport}>
            Export Audit (Excel)
          </button>
        </div>
      </div>
      <div className="table-wrap">
        <table className="at">
          <thead>
            <tr>
              <th>Time (UTC)</th>
              <th>Action</th>
              <th>Emp ID</th>
              <th>Employee</th>
              <th>Status Change</th>
              <th>By</th>
              <th>Details</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((a, i) => (
                <tr key={`${a.time}-${i}`}>
                  <td className="mono">{a.time}</td>
                  <td className={`act ${a.action}`}>{a.action}</td>
                  <td className="mono">{a.emp_id}</td>
                  <td>{a.employee}</td>
                  <td>{a.change}</td>
                  <td>{a.by}</td>
                  <td>{a.details}</td>
                  <td className="sub">{a.source}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="empty">
                  No audit entries yet. Reviews, sends and exports are recorded here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}