import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import './PerformanceLetters.css';
import { APP_VERSION, SOURCE, SOURCE_ROWS, loadFromSource } from '../Data/appraisalData';

const utcNow = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const QUARTERS = [
  ['instalment_q1', 'first quarter'],
  ['instalment_q2', 'second quarter'],
  ['instalment_q3', 'third quarter'],
  ['instalment_q4', 'fourth quarter']
];

const EMPTY = {
  emp_id: '',
  employee_name: '',
  employee_email: '',
  new_base_salary: 0,
  hike_amount: 0,
  new_pb_offered: 0,
  instalment_q1: 0,
  instalment_q2: 0,
  instalment_q3: 0,
  instalment_q4: 0,
  new_rb: 0,
  total_bonus: 0,
  total_ctc_rewards: 0,
  promotion: false,
  new_title: '',
  super_manager: '',
  department: '',
  status: 'Draft',
  reviewed_at: '',
  reviewed_by: '',
  dispatch_timestamp: '',
  sent_by: ''
};

const statusLabel = (e) =>
  e.status === 'Pending' ? 'Reviewed' :
  e.status === 'Dispatched' ? 'Sent' : 'Draft';

const has = (e) => ({
  hike: Number(e.hike_amount) > 0,
  pb: Number(e.new_pb_offered) > 0,
  rb: Number(e.new_rb) > 0,
  promo: !!e.promotion
});

const coversText = (e) => {
  const h = has(e);
  const a = [];
  if (h.hike) a.push('Hike');
  if (h.pb) a.push('PB');
  if (h.rb) a.push('RB');
  if (h.promo) a.push('Promotion');
  return a.join(', ') || 'None';
};

const moneyVal = (v) => Number(v) > 0 ? inr(v) : '—';

const COLS = [
  {
    k: 'status',
    label: 'Status',
    cls: 's1',
    val: statusLabel,
    sortVal: (e) => ({ Draft: 0, Pending: 1, Dispatched: 2 })[e.status] ?? 0,
    cell: (e) => (
      <>
        <span className={`status ${e.status}`}>
          {e.status === 'Dispatched' ? '✓ ' : ''}
          {statusLabel(e)}
        </span>
        {e.dispatch_timestamp ? <div className="ts">{e.dispatch_timestamp}</div> :
          e.reviewed_at ? <div className="ts">{e.reviewed_at}</div> : null}
      </>
    )
  },
  {
    k: 'employee',
    label: 'Employee',
    cls: 's2',
    val: (e) => e.employee_name || '',
    sortVal: (e) => e.employee_name || '',
    cell: (e) => (
      <>
        <div className="name">{e.employee_name || '—'}</div>
        <div className="sub">{e.emp_id || '—'}</div>
      </>
    )
  },
  { k: 'employee_email', label: 'Email', val: (e) => e.employee_email || '', cell: (e) => e.employee_email || '—' },
  {
    k: 'covers',
    label: 'Letter Covers',
    val: coversText,
    cell: (e) => {
      const h = has(e);
      return (
        <>
          {h.hike && <span className="chip hike">Hike</span>}
          {h.pb && <span className="chip pb">PB</span>}
          {h.rb && <span className="chip rb">RB</span>}
          {h.promo && <span className="chip promo">Promotion</span>}
          {!h.hike && !h.pb && !h.rb && !h.promo && <span className="zero">—</span>}
        </>
      );
    }
  },
  ...[
    ['new_base_salary', 'New Base'],
    ['hike_amount', 'Hike'],
    ['new_pb_offered', 'New PB'],
    ['instalment_q1', 'PB Q1'],
    ['instalment_q2', 'PB Q2'],
    ['instalment_q3', 'PB Q3'],
    ['instalment_q4', 'PB Q4'],
    ['new_rb', 'New RB'],
    ['total_bonus', 'Total Bonus']
  ].map(([k, label]) => ({
    k, label, num: true,
    val: (e) => moneyVal(e[k]),
    sortVal: (e) => Number(e[k]) || 0,
    cell: (e) => Number(e[k]) > 0 ? inr(e[k]) : <span className="zero">—</span>
  })),
  {
    k: 'total_ctc_rewards',
    label: 'Total CTC',
    num: true,
    val: (e) => moneyVal(e.total_ctc_rewards),
    sortVal: (e) => Number(e.total_ctc_rewards) || 0,
    cell: (e) => <b>{inr(e.total_ctc_rewards)}</b>
  },
  {
    k: 'new_title',
    label: 'Promotion / New Title',
    val: (e) => e.promotion ? e.new_title : 'No promotion',
    cell: (e) => e.promotion ? e.new_title : <span className="zero">—</span>
  },
  { k: 'super_manager', label: 'Super Manager', val: (e) => e.super_manager || '', cell: (e) => e.super_manager || '—' },
  { k: 'department', label: 'Department', val: (e) => e.department || '', cell: (e) => e.department || '—' }
];

function FilterPopover({ col, values, current, onClose, onApply, onSort, onClear, anchor }) {
  const [query, setQuery] = useState('');
  const [checked, setChecked] = useState(() => new Set(current ? [...current] : values));
  const ref = useRef(null);

  useEffect(() => {
    const handler = (ev) => {
      if (ref.current && !ref.current.contains(ev.target) && !ev.target.closest('.fbtn')) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const visible = values.filter(v => String(v).toLowerCase().includes(query.toLowerCase()));
  const allChecked = visible.length > 0 && visible.every(v => checked.has(v));

  const toggleAll = (on) => {
    const next = new Set(checked);
    visible.forEach(v => on ? next.add(v) : next.delete(v));
    setChecked(next);
  };

  const apply = () => {
    const chosen = values.filter(v => checked.has(v));
    onApply(chosen.length === values.length && !query ? null : new Set(chosen));
  };

  const rect = anchor?.getBoundingClientRect();
  const style = {
    top: rect ? window.scrollY + rect.bottom + 4 : 80,
    left: rect ? Math.min(window.scrollX + rect.left - 10, window.scrollX + document.documentElement.clientWidth - 262) : 80
  };

  return (
    <div className="pop show" ref={ref} style={style}>
      <div className="sec">
        <button className="sort" onClick={() => onSort('asc')}>
          ↑ Sort {col.num ? 'smallest to largest' : 'A → Z'}
        </button>
        <button className="sort" onClick={() => onSort('desc')}>
          ↓ Sort {col.num ? 'largest to smallest' : 'Z → A'}
        </button>
      </div>
      <div className="sec">
        <input type="text" placeholder="Search values…" value={query} onChange={e => setQuery(e.target.value)} autoFocus />
      </div>
      <div className="vals">
        <label>
          <input type="checkbox" checked={allChecked} onChange={e => toggleAll(e.target.checked)} />
          <b>(Select all)</b>
        </label>
        {visible.map(v => (
          <label key={String(v)}>
            <input type="checkbox" checked={checked.has(v)} onChange={() => {
              const next = new Set(checked);
              next.has(v) ? next.delete(v) : next.add(v);
              setChecked(next);
            }} />
            {String(v)}
          </label>
        ))}
      </div>
      <div className="foot">
        <button className="btn" onClick={onClear}>Clear filter</button>
        <span className="foot-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={apply}>OK</button>
        </span>
      </div>
    </div>
  );
}

function Letter({ e }) {
  const h = has(e);
  const covers = [];
  if (h.promo) covers.push('Promotion');
  if (h.hike) covers.push('Salary Revision');
  if (h.pb) covers.push('Performance Bonus');
  if (h.rb) covers.push('Retention Bonus');

  const subject = covers.length
    ? covers.join(', ').replace(/, ([^,]*)$/, ' and $1')
    : 'Annual Appraisal Outcome';

  let body = '';

  if (h.promo) {
    body += `In recognition of your performance and contribution, we are pleased to inform you that you have been promoted to the position of ${e.new_title || '—'}.`;
  }
  if (h.hike) {
    body += ` Following the annual appraisal, your salary has been revised with an increase of ${inr(e.hike_amount)}. Your new base salary is ${inr(e.new_base_salary)} per annum.`;
  }
  if (h.pb || h.rb) {
    body += ` We are also pleased to award you ${[
      h.pb ? `a Performance Bonus of ${inr(e.new_pb_offered)}` : '',
      h.rb ? `a Retention Bonus of ${inr(e.new_rb)}` : ''
    ].filter(Boolean).join(' and ')}.`;
  }

  if (!body) body = 'Your current compensation and designation remain unchanged for this appraisal cycle.';

  const rows = [
    ['New Base Salary', inr(e.new_base_salary)],
    ...(h.hike ? [['Hike Amount', inr(e.hike_amount)]] : []),
    ...(h.pb ? [['Performance Bonus', inr(e.new_pb_offered)]] : []),
    ...(h.rb ? [['Retention Bonus', inr(e.new_rb)]] : []),
    ...((h.pb || h.rb) ? [['Total Bonus', inr(e.total_bonus)]] : []),
    ['Total CTC (Rewards)', inr(e.total_ctc_rewards)]
  ];

  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  return (
    <div className="letter">
      <div className="co">
        <b>COMPANY NAME</b>
        <div>Private &amp; Confidential</div>
      </div>

      <div className="meta">
        Date: {today}<br />
        To: <b>{e.employee_name || '—'}</b> ({e.emp_id || '—'})<br />
        Email: {e.employee_email || '—'}<br />
        Department: {e.department || '—'}
      </div>

      <div className="subject">Subject: {subject}</div>

      <p>Dear {e.employee_name || 'Employee'},</p>
      <p>Thank you for your contribution during the appraisal period.</p>
      <p>{body}</p>
      <p>Your revised compensation is summarised below:</p>

      <table>
        <thead>
          <tr>
            <th>Component</th>
            <th className="num">Amount (INR, per annum)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, value]) => (
            <tr key={name} className={name === 'Total CTC (Rewards)' ? 'total' : ''}>
              <td>{name}</td>
              <td className="num">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>All other terms and conditions of your employment remain unchanged. Please keep this letter confidential.</p>
      <p>We wish you continued success.</p>

      <div className="sign">
        <div className="who">
          Yours sincerely,<br /><br />
          <b>Authorised Signatory</b><br />
          Human Resources
        </div>

        {e.status === 'Dispatched' && (
          <div className="stamp">
            ✓ DISPATCHED<br />
            {e.dispatch_timestamp}<br />
            by {e.sent_by}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PerformanceLetters() {
  const initialRows = useMemo(() => {
    try {
      return loadFromSource(SOURCE_ROWS).map((e, i) => ({
        ...e,
        emp_id: e.emp_id || `EMP${String(i + 1).padStart(3, '0')}`
      }));
    } catch {
      return [];
    }
  }, []);

  const [employees, setEmployees] = useState(initialRows);
  const [active, setActive] = useState(0);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [audit, setAudit] = useState([]);
  const [actorName, setActorName] = useState('HR User');
  const [popup, setPopup] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [toastOn, setToastOn] = useState(false);
  const toastTimer = useRef(null);

  const toast = (msg) => {
    setToastMsg(msg);
    setToastOn(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastOn(false), 2200);
  };

  const actor = actorName.trim() || 'HR User';

  const colByKey = (k) => COLS.find(c => c.k === k);

  const passes = (e, skipKey = null) => {
    for (const [k, set] of Object.entries(filters)) {
      if (k === skipKey) continue;
      const c = colByKey(k);
      if (c && !set.has(String(c.val(e)))) return false;
    }

    if (search) {
      const q = search.toLowerCase();
      const hay = COLS.map(c => String(c.val(e))).join(' ').toLowerCase() + ` ${e.emp_id || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }

    return true;
  };

  const visibleRows = () => {
    const rows = employees.map((e, i) => ({ e, i })).filter(x => passes(x.e));

    if (sort) {
      const c = colByKey(sort.k);
      const fn = c?.sortVal || c?.val;
      rows.sort((a, b) => {
        const x = fn(a.e);
        const y = fn(b.e);
        return (x > y ? 1 : x < y ? -1 : 0) * (sort.dir === 'asc' ? 1 : -1);
      });
    }

    return rows;
  };

  const visible = visibleRows();
  const cur = employees[active] || EMPTY;

  const addAudit = (action, e, from = '', to = '', details = '') => {
    const entry = {
      time: utcNow(),
      action,
      emp_id: e?.emp_id || '',
      employee: e?.employee_name || '',
      change: from ? `${from} → ${to}` : '',
      by: actor,
      details,
      source: `${SOURCE.name} ${SOURCE.version}`
    };
    setAudit(a => [...a, entry]);
  };

  const reviewOne = () => {
    if (!employees[active] || cur.status !== 'Draft') return;

    const now = utcNow();
    const next = employees.map((e, i) =>
      i === active ? { ...e, status: 'Pending', reviewed_at: now, reviewed_by: actor } : e
    );

    setEmployees(next);
    addAudit('Reviewed', cur, 'Draft', 'Reviewed');
    toast('Letter marked as reviewed');
  };

  const sendOne = () => {
    if (!employees[active] || cur.status !== 'Pending') return;

    const now = utcNow();
    const next = employees.map((e, i) =>
      i === active ? {
        ...e,
        status: 'Dispatched',
        dispatch_timestamp: now,
        sent_by: actor
      } : e
    );

    setEmployees(next);
    addAudit('Sent', cur, 'Reviewed', 'Sent', `To ${cur.employee_email || ''}`);
    toast('Letter sent');
  };

  const bulkReview = () => {
    const now = utcNow();
    let count = 0;
    const entries = [];

    const next = employees.map(e => {
      if (!selected.has(e.emp_id) || e.status !== 'Draft') return e;
      count++;
      entries.push({
        time: now,
        action: 'Reviewed',
        emp_id: e.emp_id,
        employee: e.employee_name,
        change: 'Draft → Reviewed',
        by: actor,
        details: '',
        source: `${SOURCE.name} ${SOURCE.version}`
      });
      return { ...e, status: 'Pending', reviewed_at: now, reviewed_by: actor };
    });

    if (count) {
      setEmployees(next);
      setAudit(a => [...a, ...entries]);
    }

    toast(`${count} letter${count === 1 ? '' : 's'} marked as reviewed`);
  };

  const bulkSend = () => {
    const now = utcNow();
    let count = 0;
    const entries = [];

    const next = employees.map(e => {
      if (!selected.has(e.emp_id) || e.status !== 'Pending') return e;
      count++;
      entries.push({
        time: now,
        action: 'Sent',
        emp_id: e.emp_id,
        employee: e.employee_name,
        change: 'Reviewed → Sent',
        by: actor,
        details: `To ${e.employee_email || ''}`,
        source: `${SOURCE.name} ${SOURCE.version}`
      });
      return {
        ...e,
        status: 'Dispatched',
        dispatch_timestamp: now,
        sent_by: actor
      };
    });

    if (count) {
      setEmployees(next);
      setAudit(a => [...a, ...entries]);
    }

    setSelected(new Set());
    toast(`${count} letter${count === 1 ? '' : 's'} sent`);
  };

  const clearAll = () => {
    setFilters({});
    setSearch('');
    setSort(null);
  };

  const openFilter = (key, ev) => {
    const col = colByKey(key);
    const pool = employees.filter(e => passes(e, key));
    const values = [...new Set(pool.map(e => String(col.val(e))))];
    values.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    setPopup({
      key,
      col,
      values,
      current: filters[key],
      anchor: ev.currentTarget
    });
  };

  const exportGrid = (filtered) => {
    const list = filtered ? visible.map(x => x.e) : employees;

    const rows = list.map(e => ({
      Status: statusLabel(e),
      'Emp ID': e.emp_id,
      Employee: e.employee_name,
      Email: e.employee_email,
      'Letter Covers': coversText(e),
      'New Base Salary': e.new_base_salary,
      'Hike Amount': e.hike_amount,
      'New PB Offered': e.new_pb_offered,
      'PB Instalment Q1': e.instalment_q1,
      'PB Instalment Q2': e.instalment_q2,
      'PB Instalment Q3': e.instalment_q3,
      'PB Instalment Q4': e.instalment_q4,
      'New RB': e.new_rb,
      'Total Bonus': e.total_bonus,
      'Total CTC Rewards': e.total_ctc_rewards,
      Promotion: e.promotion ? 'Yes' : 'No',
      'New Title': e.new_title,
      'Super Manager': e.super_manager,
      Department: e.department,
      'Reviewed At (UTC)': e.reviewed_at,
      'Reviewed By': e.reviewed_by,
      'Dispatch Timestamp (UTC)': e.dispatch_timestamp,
      'Sent By': e.sent_by
    }));

    const info = [
      { Item: 'Exported At (UTC)', Value: utcNow() },
      { Item: 'Exported By', Value: actor },
      { Item: 'Rows', Value: list.length },
      { Item: 'Source', Value: `${SOURCE.name} ${SOURCE.version} · ${SOURCE.cycle}` },
      { Item: 'Screen Version', Value: APP_VERSION }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.length ? rows : [{}]), 'Appraisal Grid');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(info), 'Export Info');
    XLSX.writeFile(wb, `Appraisal_Grid_${utcNow().replace(/:/g, '-').replace(/\.\d{3}Z$/, 'Z')}.xlsx`);

    addAudit('Exported', null, '', '', `Grid export — ${list.length} rows (${filtered ? 'filtered' : 'all'})`);
  };

  const exportAudit = () => {
    const entry = {
      time: utcNow(),
      action: 'Exported',
      emp_id: '',
      employee: '',
      change: '',
      by: actor,
      details: `Audit trail export — ${audit.length + 1} entries`,
      source: `${SOURCE.name} ${SOURCE.version}`
    };

    const all = [...audit, entry];
    setAudit(all);

    const rows = all.map(a => ({
      'Time (UTC)': a.time,
      Action: a.action,
      'Emp ID': a.emp_id,
      Employee: a.employee,
      'Status Change': a.change,
      By: a.by,
      Details: a.details,
      Source: a.source
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Audit Trail');
    XLSX.writeFile(wb, `Appraisal_Audit_${utcNow().replace(/:/g, '-').replace(/\.\d{3}Z$/, 'Z')}.xlsx`);
  };

  const total = employees.length;
  const draft = employees.filter(e => e.status === 'Draft').length;
  const reviewed = employees.filter(e => e.status === 'Pending').length;
  const sent = employees.filter(e => e.status === 'Dispatched').length;
  const pct = total ? Math.round(sent / total * 100) : 0;

  const breakdown = (key) => {
    const groups = {};
    employees.forEach(e => {
      const name = e[key] || '—';
      groups[name] ||= { total: 0, sent: 0 };
      groups[name].total++;
      if (e.status === 'Dispatched') groups[name].sent++;
    });

    return Object.entries(groups).sort((a, b) =>
      b[1].sent - a[1].sent ||
      b[1].total - a[1].total ||
      a[0].localeCompare(b[0])
    );
  };

  const toggleBreakdown = (key, value) => {
    setFilters(f => {
      const next = { ...f };
      if (next[key]?.size === 1 && next[key].has(String(value))) delete next[key];
      else next[key] = new Set([String(value)]);
      return next;
    });
  };

  const selectedEmployees = employees.filter(e => selected.has(e.emp_id));
  const reviewCount = selectedEmployees.filter(e => e.status === 'Draft').length;
  const sendCount = selectedEmployees.filter(e => e.status === 'Pending').length;
  const allSelected = visible.length > 0 && visible.every(x => selected.has(x.e.emp_id));

  const toggleAll = (checked) => {
    const next = new Set(selected);
    visible.forEach(({ e }) => checked ? next.add(e.emp_id) : next.delete(e.emp_id));
    setSelected(next);
  };

  const toggleSelected = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const noteParts = Object.entries(filters).map(([k, set]) =>
    `${colByKey(k)?.label}: ${[...set].slice(0, 3).join(', ')}${set.size > 3 ? ` +${set.size - 3}` : ''}`
  );
  if (search) noteParts.push(`Search: "${search}"`);

  const filename = cur.emp_id ? `Appraisal_Letter_${cur.emp_id}.pdf` : 'Appraisal_Letter_Preview.pdf';

  return (
    <>
      <header>
        <div>
          <h1>
            Appraisal Letter Hub
            <span className="ver">v{APP_VERSION}</span>
          </h1>
          <p>Review, approve and dispatch annual appraisal letters.</p>
          <div className="src">{SOURCE.name} · {SOURCE.version} · {SOURCE.cycle}</div>
        </div>

        <div className="actor">
          <span>Acting as</span>
          <input value={actorName} onChange={e => setActorName(e.target.value)} placeholder="HR User" />
        </div>
      </header>

      <div className="wrap">
        <section className="stats">
          {[
            ['Total Letters', total],
            ['Draft', draft],
            ['Reviewed', reviewed],
            ['Sent', sent],
            ['% Sent', `${pct}%`]
          ].map(([label, value]) => (
            <div className="tile" key={label}>
              <span>{label}</span>
              <b>{value}</b>
              {label === '% Sent' && (
                <div className="bar"><i style={{ width: `${pct}%` }} /></div>
              )}
            </div>
          ))}

          {[
            ['Sent by Super Manager', 'super_manager'],
            ['Sent by Department', 'department']
          ].map(([title, key]) => (
            <div className="tile brk" key={key}>
              <h3>{title}</h3>
              <div className="list">
                {breakdown(key).map(([name, value]) => (
                  <div
                    className={`brow ${filters[key]?.size === 1 && filters[key].has(name) ? 'on' : ''}`}
                    key={name}
                    onClick={() => toggleBreakdown(key, name)}
                    title="Click to filter the grid"
                  >
                    <span>{name}</span>
                    <span className="n"><b>{value.sent}</b> / {value.total}</span>
                    <span className="pb"><i style={{ width: `${value.total ? value.sent / value.total * 100 : 0}%` }} /></span>
                  </div>
                ))}
                {!breakdown(key).length && <div className="zero">No data</div>}
              </div>
            </div>
          ))}
        </section>

        <div className="main">
          <div>
            <section className="card grid-card">
              <div className="card-head">
                <h2>Appraisal Grid</h2>
                <div className="tools">
                  <input
                    className="search"
                    placeholder="Search employees…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  <button className="btn" onClick={() => exportGrid(false)}>Export All</button>
                  <button className="btn" onClick={() => exportGrid(true)}>Export Filtered</button>
                  <button className="btn" onClick={clearAll}>Clear Filters</button>
                  <button className="btn" disabled={!reviewCount} onClick={bulkReview}>
                    Review selected{reviewCount ? ` (${reviewCount})` : ''}
                  </button>
                  <button className="btn green" disabled={!sendCount} onClick={bulkSend}>
                    Send selected{sendCount ? ` (${sendCount})` : ''}
                  </button>
                </div>
              </div>

              <div className={`filter-note ${noteParts.length ? 'show' : ''}`}>
                {noteParts.length > 0 && (
                  <>
                    <span>Showing {visible.length} of {employees.length} · {noteParts.join(' · ')}</span>
                    <a onClick={clearAll}>Clear all</a>
                  </>
                )}
              </div>

              <div className="table-wrap">
                <table className="grid">
                  <thead>
                    <tr>
                      <th className="s0">
                        <div className="h center">
                          <input type="checkbox" checked={allSelected} onChange={e => toggleAll(e.target.checked)} />
                        </div>
                      </th>
                      {COLS.map(c => {
                        const activeFilter = filters[c.k] || (sort && sort.k === c.k);
                        const arrow = sort?.k === c.k ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : '';
                        return (
                          <th key={c.k} className={`${c.cls || ''} ${c.num ? 'num' : ''}`}>
                            <div className="h">
                              {c.label}{arrow}
                              <button
                                className={`fbtn ${activeFilter ? 'active' : ''}`}
                                title="Filter / sort"
                                onClick={ev => openFilter(c.k, ev)}
                              >
                                ▾
                              </button>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody>
                    {!visible.length ? (
                      <tr>
                        <td colSpan={COLS.length + 1} className="empty">
                          No employees match the current filters.
                        </td>
                      </tr>
                    ) : (
                      visible.map(({ e, i }, n) => (
                        <tr
                          key={e.emp_id}
                          className={`row st-${e.status}${n % 2 ? ' band' : ''}${i === active ? ' sel' : ''}`}
                          onClick={() => setActive(i)}
                        >
                          <td className="s0">
                            <input
                              type="checkbox"
                              checked={selected.has(e.emp_id)}
                              onClick={ev => ev.stopPropagation()}
                              onChange={() => toggleSelected(e.emp_id)}
                            />
                          </td>
                          {COLS.map(c => (
                            <td key={c.k} className={`${c.cls || ''} ${c.num ? 'num' : ''}`}>
                              {c.cell(e)}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="card audit">
              <div className="card-head">
                <h2>Audit Trail</h2>
                <div className="tools">
                  <select className="sm" defaultValue="">
                    <option value="">All actions</option>
                    <option value="Reviewed">Reviewed</option>
                    <option value="Sent">Sent</option>
                    <option value="Exported">Exported</option>
                  </select>
                  <input className="search" placeholder="Search audit…" />
                  <button className="btn" onClick={exportAudit}>Export Audit</button>
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
                    {!audit.length ? (
                      <tr>
                        <td colSpan="8" className="empty">No activity yet.</td>
                      </tr>
                    ) : (
                      [...audit].reverse().map((a, i) => (
                        <tr key={`${a.time}-${i}`}>
                          <td className="mono">{a.time}</td>
                          <td className={`act ${a.action}`}>{a.action}</td>
                          <td>{a.emp_id}</td>
                          <td>{a.employee}</td>
                          <td>{a.change}</td>
                          <td>{a.by}</td>
                          <td>{a.details}</td>
                          <td>{a.source}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <section className="card preview">
            <div className="toolbar">
              <span className="file">{filename}</span>
              <button className="btn" onClick={() => window.print()}>Print / PDF</button>
              <button
                className="btn"
                disabled={!employees.length || cur.status !== 'Draft'}
                onClick={reviewOne}
              >
                {cur.status === 'Draft' ? 'Mark Reviewed' : 'Reviewed ✓'}
              </button>
              <button
                className="btn primary"
                disabled={!employees.length || cur.status !== 'Pending'}
                title={cur.status === 'Draft' ? 'Review the letter first' : ''}
                onClick={sendOne}
              >
                {cur.status === 'Dispatched' ? 'Sent ✓' : 'Approve & Send'}
              </button>
            </div>

            <div className="paper-bg">
              <div className="mock-banner">
                {employees.length
                  ? 'Sample letter — final wording will follow the HR template.'
                  : 'Preview only — add dummy data in appraisalData.js to populate employee details.'}
              </div>
              <Letter e={cur} />
            </div>
          </section>
        </div>
      </div>

      {popup && (
        <FilterPopover
          col={popup.col}
          values={popup.values}
          current={popup.current}
          anchor={popup.anchor}
          onClose={() => setPopup(null)}
          onSort={(dir) => {
            setSort({ k: popup.key, dir });
            setPopup(null);
          }}
          onClear={() => {
            setFilters(f => {
              const n = { ...f };
              delete n[popup.key];
              return n;
            });
            if (sort?.k === popup.key) setSort(null);
            setPopup(null);
          }}
          onApply={(value) => {
            setFilters(f => {
              const n = { ...f };
              if (value) n[popup.key] = value;
              else delete n[popup.key];
              return n;
            });
            setPopup(null);
          }}
        />
      )}

      <div className={`toast ${toastOn ? 'show' : ''}`}>{toastMsg}</div>
    </>
  );
}
