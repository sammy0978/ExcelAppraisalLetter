/* =================================================================
   APPRAISAL DATA

   LIVE DATA WILL COME FROM CATALYST DATA STORE.

   No employee/appraisal records are hardcoded here.
================================================================= */

export const APP_VERSION = '2.0';

export const SOURCE = {
  name: 'Catalyst Data Store',
  version: 'Live',
  cycle: 'Appraisal 2026'
};


/* =================================================================
   FRONTEND FIELD MAP

   These are the property names used by PerformanceLetters.js.
================================================================= */

export const FIELD_MAP = {
  emp_id: 'emp_id',
  employee_name: 'employee_name',
  employee_email: 'employee_email',

  new_base_salary: 'new_base_salary',
  hike_amount: 'hike_amount',

  new_pb_offered: 'new_pb_offered',

  instalment_q1: 'instalment_q1',
  instalment_q2: 'instalment_q2',
  instalment_q3: 'instalment_q3',
  instalment_q4: 'instalment_q4',

  new_rb: 'new_rb',
  total_bonus: 'total_bonus',
  total_ctc_rewards: 'total_ctc_rewards',

  promotion: 'promotion',
  new_title: 'new_title',

  super_manager: 'super_manager',
  department: 'department',

  status: 'status',

  reviewed_at: 'reviewed_at',
  reviewed_by: 'reviewed_by',

  dispatch_timestamp: 'dispatch_timestamp',
  sent_by: 'sent_by'
};


/* =================================================================
   COMPATIBILITY EXPORT

   PerformanceLetters.js currently imports SOURCE_ROWS.

   We keep this export temporarily so the application compiles.

   IMPORTANT:
   There are NO hardcoded employee records here.
================================================================= */

export const SOURCE_ROWS = [];


/* =================================================================
   NORMALIZE ONE RECORD
================================================================= */

export function normalizeRecord(src = {}) {
  const e = {};

  for (const field of Object.keys(FIELD_MAP)) {
    e[field] = src[field] ?? '';
  }

  /* Convert promotion to boolean */
  e.promotion = [
    'Y',
    'YES',
    'TRUE',
    '1',
    true,
    1
  ].includes(
    typeof e.promotion === 'string'
      ? e.promotion.toUpperCase()
      : e.promotion
  );

  /* Preserve status supplied by Catalyst */
  if (!e.status) {
    e.status = 'Draft';
  }

  return e;
}


/* =================================================================
   NORMALIZE MULTIPLE RECORDS
================================================================= */

export function loadFromSource(rows = []) {

  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map(normalizeRecord);
}


/* =================================================================
   FETCH LIVE PERFORMANCE LETTER DATA

   The Catalyst backend URL should be configured in:

   .env

   REACT_APP_CATALYST_PERFORMANCE_API_URL=YOUR_FUNCTION_URL
================================================================= */

export async function fetchPerformanceLetters() {

  const apiUrl =
    process.env.REACT_APP_CATALYST_PERFORMANCE_API_URL;

  if (!apiUrl) {
    throw new Error(
      'REACT_APP_CATALYST_PERFORMANCE_API_URL is not configured.'
    );
  }

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {

    let message =
      `Failed to load performance data (${response.status})`;

    try {

      const errorData = await response.json();

      if (errorData?.message) {
        message = errorData.message;
      }

    } catch (error) {
      // Keep default error message.
    }

    throw new Error(message);
  }

  const result = await response.json();

  /*
    Support these possible backend responses:

    1. [
         {...},
         {...}
       ]

    2. {
         data: [...]
       }

    3. {
         records: [...]
       }
  */

  let rows = [];

  if (Array.isArray(result)) {

    rows = result;

  } else if (Array.isArray(result?.data)) {

    rows = result.data;

  } else if (Array.isArray(result?.records)) {

    rows = result.records;
  }

  return loadFromSource(rows);
}


/* =================================================================
   SOURCE INFORMATION
================================================================= */

export function getSourceInfo() {
  return SOURCE;
}

