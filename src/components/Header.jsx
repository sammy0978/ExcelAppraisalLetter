import React from 'react';
import { APP_VERSION, SOURCE } from '../Data/appraisalData';

export default function Header({ actor, onActorChange, loadedAt }) {
  return (
    <header>
      <div>
        <h1>
          Appraisal Letter Hub{' '}
          <span
            className="ver"
            title="v2.0 — Excel filters, banded rows, statistics, audit trail, Excel export, bulk actions"
          >
            v{APP_VERSION}
          </span>
        </h1>
        <p>Letters are built from the appraisal sheet. HR reviews each letter, then sends it.</p>
        <div className="src">
          {`Source: ${SOURCE.name} ${SOURCE.version} · ${SOURCE.cycle} · loaded ${loadedAt}`}
        </div>
      </div>
      <label className="actor">
        Acting as
        <input
          type="text"
          placeholder="Enter your name"
          autoComplete="off"
          value={actor}
          onChange={(ev) => onActorChange(ev.target.value)}
        />
      </label>
    </header>
  );
}