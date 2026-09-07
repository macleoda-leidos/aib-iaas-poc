import type { DbDriver } from './driver';

/**
 * The demo dataset: 100 Scottish applications with everything a screen needs to show.
 *
 * This exists because the previous demo seed left six tables empty — `addresses`,
 * `debts`, `income_expenditure`, `recommendations`, `audit_events` and `payments` —
 * while populating applications, applicants, assets and documents. A debt-advice
 * service whose applications have no debts is not a demo of anything: the case detail
 * page showed an empty creditor list, every dashboard total debt was £0, the audit
 * trail was blank, and the recommendation engine had nothing to reason about, so the
 * pages that display those things fell back to hardcoded figures.
 *
 * Three properties are deliberate:
 *
 *  - **It goes through the driver**, so one definition seeds SQLite and PostgreSQL.
 *    The previous arrangement had the hundred applications written twice — once with
 *    `better-sqlite3` in `consolidated-api/src/index.ts` and once with raw SQL in
 *    `pg-seed-applications.ts` — using different id schemes, so the two backends
 *    disagreed about what the demo data even was.
 *  - **Everything derives from the loop index**, never from `Math.random()`. The
 *    dataset is byte-identical on every boot and every test run, which is what makes
 *    a scripted demo reproducible and lets tests assert on specific cases.
 *  - **The figures are internally consistent.** A case's debts sum to its recorded
 *    total, its recommendation follows from its debt level and surplus income, and its
 *    audit events are ordered and consistent with its status. Inconsistent demo data
 *    invites exactly the questions a demo is trying to avoid.
 */

const FIRST_NAMES = [
  'Alistair', 'Fiona', 'Craig', 'Heather', 'Kenneth', 'Janet', 'Graeme', 'Eleanor', 'Malcolm', 'Brenda',
  'Iain', 'Dorothy', 'Angus', 'Morag', 'Douglas', 'Sheila', 'Robert', 'Catriona', 'Stuart', 'Margaret',
  'James', 'Eileen', 'Donald', 'Susan', 'Gordon', 'Aileen', 'William', 'Lorna', 'Andrew', 'Isla',
  'John', 'Mary', 'David', 'Linda', 'Thomas', 'Sandra', 'Michael', 'Carol', 'Peter', 'Maureen',
  'Brian', 'Jean', 'Steven', 'Kathleen', 'Paul', 'Agnes', 'Alan', 'Alison', 'Colin', 'Derek',
];

const LAST_NAMES = [
  'Morrison', 'Campbell', 'Stewart', 'Murray', 'MacDonald', 'Henderson', 'Robertson', 'Wilson', 'Thomson', 'Anderson',
  'MacLeod', 'Scott', 'Fraser', 'Sinclair', 'Grant', 'MacKenzie', 'Burns', 'MacIntyre', 'Bell', 'Paterson',
  'Cunningham', 'Kerr', 'Cameron', 'Wallace', 'Mitchell', 'Douglas', 'Ramsay', 'Baxter', 'Milne', 'Ferguson',
  'Smith', 'Brown', 'Reid', 'Clark', 'Ross', 'Young', 'Walker', 'Watson', 'Hamilton', 'Graham',
  'Duncan', 'Hunter', 'Simpson', 'Allan', 'Crawford', 'Boyd', 'Taylor', 'Adams', 'Black', 'Kennedy',
];

const STATUSES = ['approved', 'submitted', 'under_review', 'draft', 'additional_info_required', 'rejected'];

/** Scottish cities with a matching postcode district, so addresses are plausible. */
const PLACES = [
  { city: 'Edinburgh', postcode: 'EH1 1AA', region: 'Edinburgh & Lothians' },
  { city: 'Glasgow', postcode: 'G1 2AB', region: 'Glasgow & Clyde' },
  { city: 'Aberdeen', postcode: 'AB10 1EF', region: 'Aberdeen & NE' },
  { city: 'Dundee', postcode: 'DD1 4GH', region: 'Dundee & Tayside' },
  { city: 'Inverness', postcode: 'IV1 1NP', region: 'Highlands & Islands' },
  { city: 'Stirling', postcode: 'FK8 1YZ', region: 'Borders & South' },
  { city: 'Perth', postcode: 'PH1 5LM', region: 'Dundee & Tayside' },
  { city: 'Falkirk', postcode: 'FK1 2JK', region: 'Borders & South' },
  { city: 'Ayr', postcode: 'KA7 1EE', region: 'Glasgow & Clyde' },
  { city: 'Paisley', postcode: 'PA1 2ST', region: 'Glasgow & Clyde' },
];

const STREETS = [
  'Craigmillar Park', 'Marchmont Crescent', 'Byres Road', 'Union Street', 'High Street',
  'Rose Street', 'Great Western Road', 'Perth Road', 'Academy Street', 'King Street',
];

/**
 * Creditor templates. `share` is the fraction of the case's total debt this creditor
 * holds, so a case's debts always sum to its recorded total.
 */
const CREDITORS = [
  { creditor: 'Royal Bank of Scotland', type: 'personal_loan', share: 0.42 },
  { creditor: 'Barclaycard', type: 'credit_card', share: 0.28 },
  { creditor: 'City of Edinburgh Council', type: 'council_tax', share: 0.12 },
  { creditor: 'Scottish Power', type: 'utility', share: 0.08 },
  { creditor: 'HMRC', type: 'tax', share: 0.10 },
];

/**
 * Products, chosen from the case's own figures rather than at random, so the seeded
 * recommendation is one the rules engine could plausibly have produced.
 */
function chooseProduct(totalDebt: number, surplus: number, hasAssets: boolean): {
  product: string; confidence: string; confidencePct: number; reasoning: string[];
} {
  if (totalDebt < 5_000 && surplus <= 0) {
    return {
      product: 'MAP', confidence: 'high', confidencePct: 88,
      reasoning: ['Total debt below the Minimal Asset Process ceiling', 'No surplus income available for a payment programme'],
    };
  }
  if (totalDebt > 30_000 && hasAssets) {
    return {
      product: 'PTD', confidence: 'medium', confidencePct: 71,
      reasoning: ['Debt level above the usual Protected Trust Deed threshold', 'Realisable assets available to contribute to the estate'],
    };
  }
  if (totalDebt > 30_000) {
    return {
      product: 'Sequestration', confidence: 'medium', confidencePct: 66,
      reasoning: ['Debt level beyond what a payment programme could clear', 'No significant realisable assets'],
    };
  }
  if (surplus >= 50) {
    return {
      product: 'DAS', confidence: 'high', confidencePct: 87,
      reasoning: ['Surplus income sufficient to sustain a Debt Payment Programme', 'Statutory protection from creditor action while the programme runs'],
    };
  }
  return {
    product: 'Signposting', confidence: 'low', confidencePct: 42,
    reasoning: ['Figures fall between statutory routes', 'Referral to a money adviser for a full assessment'],
  };
}

/** Audit events consistent with how far a case has progressed. */
function auditTrailFor(status: string): Array<{ action: string; actorType: string; actorName: string }> {
  const trail = [
    { action: 'application_created', actorType: 'applicant', actorName: 'Applicant' },
    { action: 'application_updated', actorType: 'applicant', actorName: 'Applicant' },
  ];
  if (status === 'draft') return trail;

  trail.push({ action: 'application_submitted', actorType: 'applicant', actorName: 'Applicant' });
  if (status === 'submitted') return trail;

  trail.push({ action: 'status_changed_to_under_review', actorType: 'staff', actorName: 'AiB Officer' });
  if (status === 'under_review') return trail;

  if (status === 'additional_info_required') {
    trail.push({ action: 'status_changed_to_additional_info_required', actorType: 'staff', actorName: 'AiB Officer' });
    return trail;
  }

  trail.push({ action: 'recommendation_issued', actorType: 'system', actorName: 'Rules Engine' });
  trail.push({ action: `status_changed_to_${status}`, actorType: 'staff', actorName: 'AiB Senior Officer' });
  return trail;
}

/** `INSERT ... unless already present`, in whichever dialect is in use. */
function insertIgnoring(driver: DbDriver, table: string, columns: string, paramCount: number): string {
  const placeholders = Array(paramCount).fill('?').join(', ');
  return driver.dialect === 'postgres'
    ? `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`
    : `INSERT OR IGNORE INTO ${table} (${columns}) VALUES (${placeholders})`;
}

const pad = (n: number) => String(n).padStart(4, '0');

export interface DemoSeedCounts {
  applications: number;
  applicants: number;
  addresses: number;
  debts: number;
  incomeExpenditure: number;
  recommendations: number;
  auditEvents: number;
  payments: number;
}

/**
 * Seed the relational detail for the 100 demo applications.
 *
 * Assumes the applications, applicants, assets and documents already exist (created
 * by the caller), and fills in the tables that were left empty. Idempotent: every
 * insert tolerates a conflict, and ids are derived from the index, so re-running
 * changes nothing.
 *
 * `debtorUserId` is applied to every tenth case, matching the convention used when the
 * applications themselves are seeded — enough for the debtor's own view and the
 * ownership checks to have data, without one person implausibly owning a hundred cases.
 */
export async function seedDemoDetail(driver: DbDriver, applicationCount = 100): Promise<DemoSeedCounts> {
  const counts: DemoSeedCounts = {
    applications: applicationCount, applicants: 0, addresses: 0, debts: 0,
    incomeExpenditure: 0, recommendations: 0, auditEvents: 0, payments: 0,
  };

  const insertAddress = insertIgnoring(driver, 'addresses',
    'id, application_id, line1, line2, city, postcode, is_current, resident_from, resident_to', 9);
  const insertDebt = insertIgnoring(driver, 'debts',
    'id, application_id, creditor, type, amount, monthly_payment, account_ref', 7);
  const insertIE = insertIgnoring(driver, 'income_expenditure',
    'id, application_id, income, expenditure', 4);
  const insertRec = insertIgnoring(driver, 'recommendations',
    'id, application_id, product, confidence, confidence_pct, reasoning, factors, alternatives, engine_version, generated_at', 10);
  const insertAudit = insertIgnoring(driver, 'audit_events',
    'id, application_id, action, actor_id, actor_name, actor_type, details, timestamp', 8);
  const insertPayment = insertIgnoring(driver, 'payments',
    'id, application_id, amount, currency, status, provider, provider_ref, paid_at, created_at', 9);

  // Statuses are read from the rows rather than recomputed. Deriving them here from
  // the index would let the detail disagree with the application it hangs off — a
  // recommendation attached to a case the table says is still a draft, for instance.
  // The caller owns the application; this owns only its detail.
  const seeded = await driver.all<{ id: string; status: string }>(
    `SELECT id, status FROM applications WHERE id LIKE 'app-seed-%' ORDER BY id`
  );
  const statusById = new Map(seeded.map(row => [row.id, row.status]));

  for (let i = 1; i <= applicationCount; i++) {
    const id = `app-seed-${pad(i)}`;
    // Falls back to the index-derived status only if the application is absent, which
    // means the caller has not created it and none of the inserts below will land.
    const status = statusById.get(id) ?? STATUSES[i % STATUSES.length];
    const place = PLACES[i % PLACES.length];
    const day = ((i - 1) % 28) + 1;
    const month = i <= 50 ? '06' : '07';
    const date = `2026-${month}-${String(day).padStart(2, '0')}T10:00:00Z`;

    // £1,800–£47,800, stepped so the set spans every product threshold.
    const totalDebt = 1_800 + ((i * 2_137) % 46_000);
    const income = 1_450 + ((i * 173) % 1_600);
    const expenditure = Math.round(income * (0.72 + ((i % 7) * 0.045)));
    const surplus = income - expenditure;
    // Matches the asset profiles used when assets are seeded: one in six has none.
    const hasAssets = i % 6 !== 0;

    // ── Addresses: a current one, and a previous one for every third case ──
    await driver.run(insertAddress, [
      `addr-seed-${pad(i)}-0`, id,
      `${((i * 7) % 120) + 1} ${STREETS[i % STREETS.length]}`,
      i % 4 === 0 ? 'Flat 2' : null,
      place.city, place.postcode, true,
      `20${19 + (i % 5)}-0${(i % 9) + 1}-01`, null,
    ]);
    counts.addresses++;

    if (i % 3 === 0) {
      const previous = PLACES[(i + 3) % PLACES.length];
      await driver.run(insertAddress, [
        `addr-seed-${pad(i)}-1`, id,
        `${((i * 11) % 90) + 1} ${STREETS[(i + 4) % STREETS.length]}`,
        null, previous.city, previous.postcode, false,
        '2015-04-01', `20${19 + (i % 5)}-0${(i % 9) + 1}-01`,
      ]);
      counts.addresses++;
    }

    // ── Debts: 2–5 creditors whose amounts sum to totalDebt ──
    const creditorCount = 2 + (i % 4);
    const used = CREDITORS.slice(0, creditorCount);
    const shareTotal = used.reduce((s, c) => s + c.share, 0);
    let allocated = 0;

    for (let d = 0; d < used.length; d++) {
      const creditor = used[d];
      // The last creditor takes the remainder, so rounding cannot make the parts
      // disagree with the total the dashboard displays.
      const amount = d === used.length - 1
        ? totalDebt - allocated
        : Math.round((totalDebt * creditor.share) / shareTotal);
      allocated += amount;

      await driver.run(insertDebt, [
        `debt-seed-${pad(i)}-${d}`, id,
        // Council tax is levied by the council where the debtor lives.
        creditor.type === 'council_tax' ? `${place.city} Council` : creditor.creditor,
        creditor.type, amount,
        creditor.type === 'utility' || creditor.type === 'tax' ? 0 : Math.round(amount * 0.023),
        `${creditor.type.slice(0, 2).toUpperCase()}-${100_000 + i * 37 + d}`,
      ]);
      counts.debts++;
    }

    // ── Income and expenditure, summing to the figures above ──
    await driver.run(insertIE, [
      `ie-seed-${pad(i)}`, id,
      JSON.stringify({
        wages: ['unemployed', 'retired'].includes(['employed', 'self_employed', 'unemployed', 'retired'][i % 4]) ? 0 : income - 180,
        benefits: 180,
        pension: 0,
        other: 0,
      }),
      JSON.stringify({
        rent: Math.round(expenditure * 0.42),
        councilTax: Math.round(expenditure * 0.09),
        utilities: Math.round(expenditure * 0.11),
        food: Math.round(expenditure * 0.19),
        transport: Math.round(expenditure * 0.09),
        insurance: Math.round(expenditure * 0.05),
        other: expenditure - Math.round(expenditure * 0.95),
      }),
    ]);
    counts.incomeExpenditure++;

    // ── Recommendation, for cases that have progressed far enough to have one ──
    if (!['draft', 'submitted'].includes(status)) {
      const choice = chooseProduct(totalDebt, surplus, hasAssets);
      await driver.run(insertRec, [
        `rec-seed-${pad(i)}`, id,
        choice.product, choice.confidence, choice.confidencePct,
        JSON.stringify(choice.reasoning),
        JSON.stringify({ totalDebt, monthlyIncome: income, monthlyExpenditure: expenditure, surplusIncome: surplus, hasRealisableAssets: hasAssets }),
        JSON.stringify(
          [
            { product: 'DAS', score: Math.max(10, 90 - Math.round(totalDebt / 600)) },
            { product: 'MAP', score: totalDebt < 10_000 ? 74 : 31 },
          ].filter(a => a.product !== choice.product)
        ),
        '2.1.0', date,
      ]);
      counts.recommendations++;
    }

    // ── Audit trail, ordered and consistent with the status ──
    const trail = auditTrailFor(status);
    for (let e = 0; e < trail.length; e++) {
      const event = trail[e];
      // Each event an hour after the last, so the timeline reads in order.
      const timestamp = `2026-${month}-${String(day).padStart(2, '0')}T${String(10 + e).padStart(2, '0')}:15:00Z`;
      await driver.run(insertAudit, [
        `audit-seed-${pad(i)}-${e}`, id, event.action, null, event.actorName, event.actorType,
        JSON.stringify({ seeded: true, applicationReference: `IAAS-2026-${String(i).padStart(5, '0')}` }),
        timestamp,
      ]);
      counts.auditEvents++;
    }

    // ── Payment: the £90 application fee, for cases past submission ──
    if (!['draft'].includes(status)) {
      const paid = !['rejected'].includes(status);
      await driver.run(insertPayment, [
        `pay-seed-${pad(i)}`, id, 90, 'GBP',
        paid ? 'completed' : 'failed',
        ['card', 'apple_pay', 'google_pay'][i % 3],
        `${['CD', 'AP', 'GP'][i % 3]}-${String(400_000 + i * 13).slice(0, 8)}`,
        paid ? date : null, date,
      ]);
      counts.payments++;
    }
  }

  return counts;
}
