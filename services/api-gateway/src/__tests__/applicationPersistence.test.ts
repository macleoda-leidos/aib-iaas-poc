import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminHeaders } from '../../../../tests/helpers/authHeaders';
import http from 'http';
import { app } from '../index';
import { applications } from '../db';
import { toApplicationInput } from '../routes/applicationMapping';

/**
 * That the `/apply` journey's data is actually stored.
 *
 * The defect: the journey's auto-save posts `debtorDetails`, `addressHistory`,
 * `contactDetails`, `debtSummary` and `assets`, while the repository expected
 * `applicant`, `addresses`, `debts` and `assets` with different field names inside
 * each. `update()` looked for keys it recognised and ignored the rest, so the endpoint
 * answered 200, the applicant saw "Saved", and their name, date of birth, NI number,
 * addresses, debts and assets were discarded. Only `systemChecks`, `creditCheck` and
 * `incomeExpenditure` happened to use matching names and survive.
 *
 * Every test below asserts against what came back **out of the database**, not
 * against the response to the write. Asserting on the write's own response is what
 * allowed this to pass unnoticed — a 200 was never in doubt.
 */

// Populated in beforeAll. Application routes now require an authenticated caller —
// the anonymous assertions this replaces were the finding, not the baseline.
let auth: Record<string, string> = {};

let server: http.Server;
let baseUrl: string;

/** Exactly the payload shape `saveToBackend` in apps/web/src/app/apply/page.tsx sends. */
const journeyPayload = {
  debtorDetails: {
    title: 'Mr',
    firstName: 'Alistair',
    lastName: 'Morrison',
    dateOfBirth: '1982-03-14',
    nationalInsuranceNumber: 'AB123456C',
    maritalStatus: 'married',
    dependants: 2,
    employmentStatus: 'employed',
  },
  addressHistory: {
    current: { line1: '14 Craigmillar Park', line2: 'Newington', city: 'Edinburgh', postcode: 'EH16 5PB', residentSince: '2019-06-01' },
    previous: [
      { line1: '28 Marchmont Crescent', city: 'Edinburgh', postcode: 'EH9 1HQ', residentFrom: '2015-08-01', residentTo: '2019-05-31' },
    ],
  },
  contactDetails: { email: 'alistair.morrison@example.com', phone: '07412345678' },
  debtSummary: {
    totalDebtAmount: 21340,
    creditorsCount: 3,
    debts: [
      { creditorName: 'Royal Bank of Scotland', creditorType: 'personal_loan', outstandingAmount: 12500, monthlyPayment: 285 },
      { creditorName: 'Barclaycard', creditorType: 'credit_card', outstandingAmount: 8200, monthlyPayment: 164 },
      { creditorName: 'City of Edinburgh Council', creditorType: 'council_tax', outstandingAmount: 640, monthlyPayment: 0 },
    ],
  },
  incomeExpenditure: {
    income: { wages: 2150, benefits: 180 },
    expenditure: { rent: 850, councilTax: 145 },
    totalIncome: 2330,
    totalExpenditure: 995,
  },
  assets: {
    noAssets: false,
    vehicles: [{ description: '2017 Vauxhall Astra 1.4 SRi', value: 6500, outstanding: 3200, isEssential: true }],
    savings: [{ description: 'ISA savings account', value: 420, outstanding: 0, isEssential: false }],
  },
};

function request(method: string, path: string, body?: any): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const req = http.request(
      { hostname: url.hostname, port: url.port, path: url.pathname + url.search, method, headers: { 'Content-Type': 'application/json', ...auth } },
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

describe('the journey payload persists on create', () => {
  let id: string;

  beforeAll(async () => {
    const res = await request('POST', '/api/applications', journeyPayload);
    expect(res.status).toBe(201);
    id = res.data.data.id;
  });

  it('stores the applicant, renaming the fields it has to', async () => {
    const stored = await applications.getWithRelations(id);
    expect(stored!.applicant).not.toBeNull();
    expect(stored!.applicant!.firstName).toBe('Alistair');
    expect(stored!.applicant!.lastName).toBe('Morrison');
    expect(stored!.applicant!.dateOfBirth).toBe('1982-03-14');
    // nationalInsuranceNumber -> ni_number, employmentStatus -> employment
    expect(stored!.applicant!.niNumber).toBe('AB123456C');
    expect(stored!.applicant!.employment).toBe('employed');
    expect(stored!.applicant!.dependants).toBe(2);
  });

  it('folds contactDetails into the applicant row', async () => {
    // Email and phone are their own section on the form but belong to the applicant.
    const stored = await applications.getWithRelations(id);
    expect(stored!.applicant!.email).toBe('alistair.morrison@example.com');
    expect(stored!.applicant!.phone).toBe('07412345678');
  });

  it('flattens addressHistory into current and previous addresses', async () => {
    const stored = await applications.getWithRelations(id);
    expect(stored!.addresses).toHaveLength(2);

    const current = stored!.addresses.find(a => a.isCurrent);
    const previous = stored!.addresses.find(a => !a.isCurrent);
    expect(current!.line1).toBe('14 Craigmillar Park');
    expect(current!.postcode).toBe('EH16 5PB');
    expect(current!.residentFrom).toBe('2019-06-01');
    expect(previous!.line1).toBe('28 Marchmont Crescent');
    expect(previous!.residentTo).toBe('2019-05-31');
  });

  it('stores every debt with its amount under the right column', async () => {
    // creditorName -> creditor, outstandingAmount -> amount. Getting this wrong
    // silently would store zero-value debts, which changes the recommendation.
    const stored = await applications.getWithRelations(id);
    expect(stored!.debts).toHaveLength(3);

    const rbs = stored!.debts.find(d => d.creditor === 'Royal Bank of Scotland');
    expect(rbs!.amount).toBe(12500);
    expect(rbs!.monthlyPayment).toBe(285);
    expect(rbs!.type).toBe('personal_loan');

    const total = stored!.debts.reduce((sum, d) => sum + d.amount, 0);
    expect(total).toBe(21340);
  });

  it('flattens the grouped assets and infers a type from the group', async () => {
    const stored = await applications.getWithRelations(id);
    expect(stored!.assets).toHaveLength(2);

    const vehicle = stored!.assets.find(a => a.type === 'vehicle');
    expect(vehicle!.description).toBe('2017 Vauxhall Astra 1.4 SRi');
    expect(vehicle!.value).toBe(6500);
    expect(vehicle!.outstanding).toBe(3200);
    expect(vehicle!.isEssential).toBe(true);

    expect(stored!.assets.find(a => a.type === 'savings')!.value).toBe(420);
  });

  it('stores income and expenditure without the derived totals', async () => {
    // totalIncome/totalExpenditure are derived. Storing them would let them
    // contradict the figures they come from.
    const stored = await applications.getWithRelations(id);
    expect(stored!.incomeExpenditure!.income).toEqual({ wages: 2150, benefits: 180 });
    expect(stored!.incomeExpenditure!.expenditure).toEqual({ rent: 850, councilTax: 145 });
    expect(stored!.incomeExpenditure!.income).not.toHaveProperty('totalIncome');
  });
});

describe('the journey payload persists on update', () => {
  it('fills in an empty draft, as the auto-save does', async () => {
    // The real sequence: POST {} to start a draft, then PUT the accumulated form.
    const created = await request('POST', '/api/applications', {});
    const id = created.data.data.id;
    expect((await applications.getWithRelations(id))!.applicant).toBeNull();

    const res = await request('PUT', `/api/applications/${id}`, journeyPayload);
    expect(res.status).toBe(200);

    const stored = await applications.getWithRelations(id);
    expect(stored!.applicant!.lastName).toBe('Morrison');
    expect(stored!.addresses).toHaveLength(2);
    expect(stored!.debts).toHaveLength(3);
    expect(stored!.assets).toHaveLength(2);
  });

  it('replaces lists rather than appending, so repeated saves do not duplicate', async () => {
    // The auto-save posts the whole current list on every keystroke. Appending would
    // give an applicant three copies of every creditor by the time they finished.
    const created = await request('POST', '/api/applications', {});
    const id = created.data.data.id;

    for (let i = 0; i < 3; i++) {
      await request('PUT', `/api/applications/${id}`, journeyPayload);
    }

    const stored = await applications.getWithRelations(id);
    expect(stored!.debts).toHaveLength(3);
    expect(stored!.addresses).toHaveLength(2);
    expect(stored!.assets).toHaveLength(2);
  });

  it('reflects a corrected debt amount rather than keeping both values', async () => {
    const created = await request('POST', '/api/applications', journeyPayload);
    const id = created.data.data.id;

    await request('PUT', `/api/applications/${id}`, {
      debtSummary: { debts: [{ creditorName: 'Royal Bank of Scotland', creditorType: 'personal_loan', outstandingAmount: 9000, monthlyPayment: 200 }] },
    });

    const stored = await applications.getWithRelations(id);
    expect(stored!.debts).toHaveLength(1);
    expect(stored!.debts[0].amount).toBe(9000);
  });

  it('does not erase a section the save did not touch', async () => {
    // Sections are saved as they are completed, so an address save must leave the
    // debts alone. Replace-on-provided, untouched-when-absent.
    const created = await request('POST', '/api/applications', journeyPayload);
    const id = created.data.data.id;

    await request('PUT', `/api/applications/${id}`, {
      addressHistory: { current: { line1: '1 New Street', city: 'Glasgow', postcode: 'G1 1AA' }, previous: [] },
    });

    const stored = await applications.getWithRelations(id);
    expect(stored!.addresses).toHaveLength(1);
    expect(stored!.addresses[0].city).toBe('Glasgow');
    // Untouched.
    expect(stored!.debts).toHaveLength(3);
    expect(stored!.applicant!.lastName).toBe('Morrison');
  });
});

describe('the mapper, directly', () => {
  it('accepts the persistence vocabulary unchanged', () => {
    // A direct API caller — and the published API documentation — uses `applicant`,
    // `addresses` and `debts`. Translating the form's vocabulary must not stop that
    // working, which is a regression this pins.
    const input = toApplicationInput({
      applicant: { firstName: 'Direct', lastName: 'Caller' },
      debts: [{ creditor: 'Bank', type: 'loan', amount: 100 }],
      addresses: [{ line1: '1 A Street', city: 'Perth', postcode: 'PH1 1AA', isCurrent: true }],
    });

    expect(input.applicant!.firstName).toBe('Direct');
    expect(input.debts).toHaveLength(1);
    expect(input.addresses).toHaveLength(1);
  });

  it('omits keys the caller did not send', () => {
    // A partial save must produce a partial update, or an auto-save of one section
    // would blank the others.
    expect(Object.keys(toApplicationInput({ debtorDetails: { firstName: 'A', lastName: 'B' } }))).toEqual(['applicant']);
    expect(toApplicationInput({})).toEqual({});
  });

  it('skips rows that would violate a NOT NULL column', () => {
    // A half-entered creditor or a partially typed address cannot become a row.
    // Failing the whole save because the applicant is mid-sentence would be worse.
    expect(toApplicationInput({ debtSummary: { debts: [{ creditorName: 'No amount yet' }] } }).debts).toBeUndefined();
    expect(toApplicationInput({ addressHistory: { current: { line1: '1 Only line one' } } }).addresses).toBeUndefined();
    expect(toApplicationInput({ debtorDetails: { firstName: 'Only first' } }).applicant).toBeUndefined();
  });

  it('never maps debtorUserId, whatever the body says', () => {
    // Ownership comes from the verified token. If it could arrive in the body, the
    // ownership checks would be bypassable by asking.
    const input = toApplicationInput({ debtorUserId: 'user-admin', debtorDetails: { firstName: 'A', lastName: 'B' } });
    expect(input).not.toHaveProperty('debtorUserId');
  });

  it('coerces amounts that arrive as strings', () => {
    const input = toApplicationInput({
      debtSummary: { debts: [{ creditorName: 'Utility', outstandingAmount: '640', monthlyPayment: '0' }] },
    });
    expect(input.debts![0].amount).toBe(640);
    expect(input.debts![0].monthlyPayment).toBe(0);
  });

  it('defaults a missing debt type rather than dropping the debt', () => {
    // `type` is NOT NULL, but the creditor and amount are the parts that matter for
    // a recommendation — losing a £12,500 debt because its category was blank would
    // change the advice given.
    const input = toApplicationInput({
      debtSummary: { debts: [{ creditorName: 'Unknown Type Ltd', outstandingAmount: 500 }] },
    });
    expect(input.debts).toHaveLength(1);
    expect(input.debts![0].type).toBe('other');
  });
});
