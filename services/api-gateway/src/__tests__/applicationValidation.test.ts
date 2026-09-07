import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminHeaders } from '../../../../tests/helpers/authHeaders';
import http from 'http';
import { app } from '../index';
import { applications } from '../db';

/**
 * Request-body validation on the application routes, now driven by the shared Zod
 * schemas in `packages/validation` rather than a hand-rolled validator.
 *
 * Two things are being pinned, and the second matters more than the first:
 *
 *  1. That malformed input is rejected — the obvious part.
 *  2. That *partial* input is still accepted. The `/apply` journey creates a draft
 *     with `POST {}` and auto-saves each section as it is filled in, so a schema
 *     demanding a complete application would break the journey on the first
 *     keystroke. Wiring validation in is only safe because it is draft-tolerant, and
 *     the tests that would catch someone tightening it are the accept cases.
 */

// Populated in beforeAll. Application routes now require an authenticated caller —
// the anonymous assertions this replaces were the finding, not the baseline.
let auth: Record<string, string> = {};

let server: http.Server;
let baseUrl: string;

function request(method: string, path: string, body?: any): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: { 'Content-Type': 'application/json', ...auth },
      },
      res => {
        let data = '';
        res.on('data', c => (data += c));
        res.on('end', () => {
          try { resolve({ status: res.statusCode || 0, data: JSON.parse(data) }); }
          catch { resolve({ status: res.statusCode || 0, data }); }
        });
      }
    );
    req.on('error', reject);
    if (body !== undefined) req.write(JSON.stringify(body));
    req.end();
  });
}

beforeAll(async () => {
  auth = await adminHeaders();
  await new Promise<void>(resolve => {
    server = app.listen(0, () => {
      baseUrl = `http://localhost:${(server.address() as any).port}`;
      resolve();
    });
  });
});

afterAll(() => server?.close());

describe('drafts remain acceptable', () => {
  it('accepts an empty body, creating an empty draft', async () => {
    // How `/apply` begins. A schema requiring any field would break it here.
    const res = await request('POST', '/api/applications', {});
    expect(res.status).toBe(201);
    expect(res.data.data.status).toBe('draft');
  });

  it('accepts a single half-filled section', async () => {
    const res = await request('POST', '/api/applications', {
      debtorDetails: { firstName: 'Alistair' },
    });
    expect(res.status).toBe(201);
  });

  it('accepts an untouched optional NI number sent as an empty string', async () => {
    // An optional input that was never typed into arrives as ''. That means "not
    // answered", not "answered badly", so it must not be validated as a NI number.
    const res = await request('POST', '/api/applications', {
      debtorDetails: { firstName: 'Fiona', lastName: 'Campbell', nationalInsuranceNumber: '' },
    });
    expect(res.status).toBe(201);
  });

  it('accepts zero dependants', async () => {
    // The regression `tests/integration/dependants-validation.test.ts` exists for:
    // zero is a legitimate answer, and a falsy check reads it as missing.
    const res = await request('POST', '/api/applications', {
      debtorDetails: { firstName: 'Craig', lastName: 'Stewart', dependants: 0 },
    });
    expect(res.status).toBe(201);
  });

  it('accepts the sections the repository does not yet persist', async () => {
    // `addressHistory`, `contactDetails` and `assets` are sent by the journey's
    // auto-save. They are currently discarded downstream — a defect recorded
    // separately — but rejecting them here would break the journey rather than fix
    // anything, so the schema passes them through.
    const res = await request('POST', '/api/applications', {
      addressHistory: { current: { line1: '1 Royal Mile', city: 'Edinburgh' }, previous: [] },
      contactDetails: { email: 'a@example.com', phone: '07700900123' },
      assets: { items: [] },
    });
    expect(res.status).toBe(201);
  });

  it('does not crash when a list-shaped field arrives as an object', async () => {
    // Regression. `assets: {}` is exactly what the `/apply` auto-save sends when the
    // applicant has entered no assets, and the repository iterated it with `for...of`
    // — a TypeError on a non-iterable, surfacing as a 500. Reachable from the real
    // client, and hidden only because the journey sends this field on update (where
    // it was ignored) rather than on create.
    for (const body of [
      { assets: {} },
      { debts: {} },
      { addresses: {} },
    ]) {
      const res = await request('POST', '/api/applications', body);
      expect(res.status, JSON.stringify(body)).not.toBe(500);
    }
  });
});

describe('malformed input is rejected', () => {
  it.each([
    ['a one-character first name', { debtorDetails: { firstName: 'A' } }, 'First name must be at least 2 characters'],
    ['a one-character last name', { debtorDetails: { lastName: 'B' } }, 'Last name must be at least 2 characters'],
    ['a future date of birth', { debtorDetails: { dateOfBirth: '2099-01-01' } }, 'Date of birth cannot be in the future'],
    ['an unparseable date of birth', { debtorDetails: { dateOfBirth: 'not-a-date' } }, 'Date of birth must be a valid date'],
    ['21 dependants', { debtorDetails: { dependants: 21 } }, 'Dependants must be between 0 and 20'],
    ['negative dependants', { debtorDetails: { dependants: -1 } }, 'Dependants must be between 0 and 20'],
    ['an unknown employment status', { debtorDetails: { employmentStatus: 'freelancing' } }, 'Employment status must be one of'],
  ])('rejects %s', async (_label, body, expectedFragment) => {
    const res = await request('POST', '/api/applications', body);
    expect(res.status).toBe(400);
    expect(res.data.error.code).toBe('VALIDATION_ERROR');
    expect(res.data.error.details.join(' | ')).toContain(expectedFragment);
  });

  it('rejects a malformed NI number', async () => {
    const res = await request('POST', '/api/applications', {
      debtorDetails: { nationalInsuranceNumber: 'ABC12345' },
    });
    expect(res.status).toBe(400);
    expect(res.data.error.details.join(' | ')).toContain('NI number must be in format AB123456C');
  });

  it('rejects an NI number with a prefix HMRC never issues', async () => {
    // The hand-rolled validator caught this list but accepted `DF123456Z`, which the
    // character-class rule below rules out. Both checks are needed.
    const res = await request('POST', '/api/applications', {
      debtorDetails: { nationalInsuranceNumber: 'GB123456C' },
    });
    expect(res.status).toBe(400);
    expect(res.data.error.details.join(' | ')).toContain('cannot start with');
  });

  it('rejects an NI number the previous validator wrongly accepted', async () => {
    // `DF123456Z`: matches `[A-Z]{2}\d{6}[A-Z]`, is not on the invalid-prefix list,
    // and is still not a possible NI number — D is not a valid first letter and Z is
    // not a valid suffix. This is the case the shared schema always had right and
    // the API did not.
    const res = await request('POST', '/api/applications', {
      debtorDetails: { nationalInsuranceNumber: 'DF123456Z' },
    });
    expect(res.status).toBe(400);
  });

  it('normalises a valid NI number rather than rejecting its formatting', async () => {
    // Lower case with spaces is how people type it. The schema coerces, and because
    // the middleware replaces the body with the parsed value, everything downstream
    // sees the canonical form.
    const res = await request('POST', '/api/applications', {
      debtorDetails: { firstName: 'Janet', lastName: 'Henderson', nationalInsuranceNumber: 'ab 12 34 56 c' },
    });
    expect(res.status).toBe(201);
  });

  it('attributes a bad debt amount to the right entry', async () => {
    // "Debt 2: ..." rather than an unattributed message — with four creditors on
    // screen, an error that does not say which one is nearly useless.
    const res = await request('POST', '/api/applications', {
      debtSummary: {
        debts: [
          { creditorName: 'Royal Bank of Scotland', outstandingAmount: 4200 },
          { creditorName: 'Barclaycard', outstandingAmount: -50 },
        ],
      },
    });
    expect(res.status).toBe(400);
    expect(res.data.error.details.join(' | ')).toContain('Debt 2:');
  });

  it('rejects a debt above the ceiling', async () => {
    const res = await request('POST', '/api/applications', {
      debtSummary: { debts: [{ creditorName: 'Mega Corp', outstandingAmount: 10_000_001 }] },
    });
    expect(res.status).toBe(400);
    expect(res.data.error.details.join(' | ')).toContain('cannot exceed 10,000,000');
  });

  it('attributes a bad income figure to its category', async () => {
    const res = await request('POST', '/api/applications', {
      incomeExpenditure: { income: { wages: 2150, benefits: -20 } },
    });
    expect(res.status).toBe(400);
    expect(res.data.error.details.join(' | ')).toContain('benefits');
  });

  it('rejects expenditure above the per-entry ceiling', async () => {
    const res = await request('POST', '/api/applications', {
      incomeExpenditure: { expenditure: { rent: 100_000 } },
    });
    expect(res.status).toBe(400);
    expect(res.data.error.details.join(' | ')).toContain('cannot exceed 99,999');
  });

  it('reports every problem at once, not just the first', async () => {
    // A form that surfaces one error per submission makes the applicant guess how
    // many more there are.
    const res = await request('POST', '/api/applications', {
      debtorDetails: { firstName: 'A', lastName: 'B', dependants: 99 },
    });
    expect(res.status).toBe(400);
    expect(res.data.error.details.length).toBeGreaterThanOrEqual(3);
  });

  it('coerces amounts sent as strings, as the form posts them', async () => {
    const res = await request('POST', '/api/applications', {
      debtSummary: { debts: [{ creditorName: 'Scottish Power', outstandingAmount: '640' }] },
    });
    expect(res.status).toBe(201);
  });
});

describe('status and note bodies', () => {
  it('rejects an unknown status', async () => {
    const created = await applications.create({ status: 'submitted' });
    const res = await request('PATCH', `/api/applications/${created.id}/status`, { status: 'banana' });
    expect(res.status).toBe(400);
    expect(res.data.error.details.join(' | ')).toContain('Status must be one of');
  });

  it('rejects a status change with no status at all', async () => {
    // Previously this reached the handler, looked up `validTransitions[status]` for
    // `undefined`, and answered 400 INVALID_TRANSITION — a misleading code for a
    // malformed request.
    const created = await applications.create({ status: 'submitted' });
    const res = await request('PATCH', `/api/applications/${created.id}/status`, {});
    expect(res.status).toBe(400);
    expect(res.data.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an empty case note', async () => {
    // The handler wrote whatever it was given, so a blank note was storable.
    const created = await applications.create({});
    const res = await request('POST', `/api/applications/${created.id}/notes`, { content: '   ' });
    expect(res.status).toBe(400);
    expect(res.data.error.details.join(' | ')).toContain('Note content is required');
  });

  it('accepts a real case note', async () => {
    const created = await applications.create({});
    const res = await request('POST', `/api/applications/${created.id}/notes`, {
      content: 'Income evidence verified against bank statements.',
      noteType: 'general',
    });
    expect(res.status).toBe(201);
  });
});

describe('validation runs before anything else', () => {
  it('rejects a malformed body without creating a row', async () => {
    // Middleware order matters: validating inside the handler after the write would
    // leave the bad row behind.
    const before = (await applications.list({ pageSize: 1 })).total;
    await request('POST', '/api/applications', { debtorDetails: { dependants: 999 } });
    const after = (await applications.list({ pageSize: 1 })).total;

    expect(after).toBe(before);
  });

  it('rejects a malformed update without touching the application', async () => {
    const created = await applications.create({ status: 'draft' });
    const res = await request('PUT', `/api/applications/${created.id}`, {
      debtorDetails: { dateOfBirth: '2099-01-01' },
    });

    expect(res.status).toBe(400);
    const after = await applications.findById(created.id);
    expect(after!.updatedAt).toBe(created.updatedAt);
  });
});
