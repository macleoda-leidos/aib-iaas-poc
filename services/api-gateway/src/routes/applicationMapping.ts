import type { CreateApplicationInput } from '@aib-iaas/database';

/**
 * Translate the request body the `/apply` journey sends into the shape the
 * repository persists.
 *
 * These were two different vocabularies for the same data, and nothing joined them:
 * the client posts `debtorDetails`, `addressHistory`, `contactDetails`, `debtSummary`
 * and `assets`, while `CreateApplicationInput` expects `applicant`, `addresses`,
 * `debts` and `assets` with different field names inside each. Because
 * `applications.update()` simply looked for keys it recognised and ignored the rest,
 * the mismatch was silent: the endpoint answered 200, the applicant saw "Saved", and
 * their name, date of birth, NI number, addresses, debts and assets were dropped on
 * the floor. Only `systemChecks`, `creditCheck` and `incomeExpenditure` happened to
 * use matching names and survive.
 *
 * The translation belongs here rather than in the repository. The repository's
 * contract is the persistence model; the API's contract is what clients send. Making
 * the repository accept both would leave two shapes for one concept in the layer
 * whose job is to have exactly one.
 */

/** `undefined` for a value the client omitted; only present keys are forwarded. */
function present<T>(value: T | undefined | null | ''): T | undefined {
  return value === undefined || value === null || value === '' ? undefined : (value as T);
}

function toNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * `debtorDetails` → `applicant`.
 *
 * Contact details are their own section on the form but belong to the applicant row,
 * so they are folded in here. `debtorDetails` wins where both carry an email or
 * phone, because that is the field the applicant filled in most recently in the
 * journey's order.
 */
function toApplicant(body: any): CreateApplicationInput['applicant'] | undefined {
  const d = body?.debtorDetails;
  const contact = body?.contactDetails;
  if (!d && !contact) return undefined;

  const applicant = {
    title: present<string>(d?.title),
    firstName: present<string>(d?.firstName),
    lastName: present<string>(d?.lastName),
    dateOfBirth: present<string>(d?.dateOfBirth),
    niNumber: present<string>(d?.nationalInsuranceNumber),
    maritalStatus: present<string>(d?.maritalStatus),
    dependants: toNumber(d?.dependants),
    employment: present<string>(d?.employmentStatus),
    email: present<string>(d?.email ?? contact?.email),
    phone: present<string>(d?.phone ?? contact?.phone),
  };

  // firstName and lastName are NOT NULL on the applicants table, so a partial
  // section cannot be inserted as a row. Returning undefined leaves the applicant
  // untouched until the applicant has given both, rather than failing the save.
  if (!applicant.firstName || !applicant.lastName) return undefined;

  return applicant as CreateApplicationInput['applicant'];
}

/** `addressHistory: { current, previous[] }` → a flat `addresses[]` with `isCurrent`. */
function toAddresses(body: any): CreateApplicationInput['addresses'] | undefined {
  const history = body?.addressHistory;
  if (!history) return undefined;

  const candidates = [
    { source: history.current, isCurrent: true },
    ...(Array.isArray(history.previous) ? history.previous : []).map((source: any) => ({
      source,
      isCurrent: false,
    })),
  ];

  const addresses = candidates
    // line1, city and postcode are NOT NULL, so an address the applicant has only
    // begun cannot become a row.
    .filter(({ source }) => source?.line1 && source?.city && source?.postcode)
    .map(({ source, isCurrent }) => ({
      line1: source.line1,
      line2: present<string>(source.line2),
      city: source.city,
      postcode: source.postcode,
      isCurrent,
      residentFrom: present<string>(source.residentSince ?? source.residentFrom),
      residentTo: present<string>(source.residentTo),
    }));

  return addresses.length > 0 ? (addresses as CreateApplicationInput['addresses']) : undefined;
}

/** `debtSummary.debts[]` → `debts[]`, renaming every field. */
function toDebts(body: any): CreateApplicationInput['debts'] | undefined {
  const source = body?.debtSummary?.debts;
  if (!Array.isArray(source)) return undefined;

  const debts = source
    // creditor, type and amount are NOT NULL. A half-entered creditor row is
    // skipped rather than inserted with placeholders.
    .filter(d => d?.creditorName && toNumber(d?.outstandingAmount) !== undefined)
    .map(d => ({
      creditor: d.creditorName,
      type: present<string>(d.creditorType) ?? 'other',
      amount: toNumber(d.outstandingAmount)!,
      monthlyPayment: toNumber(d.monthlyPayment) ?? 0,
      accountRef: present<string>(d.accountReference ?? d.accountRef),
    }));

  return debts.length > 0 ? (debts as CreateApplicationInput['debts']) : undefined;
}

/**
 * `assets` → `assets[]`.
 *
 * The form groups assets by kind — `{ properties: [], vehicles: [], savings: [],
 * other: [], noAssets: bool }` — and the table stores one flat list with a `type`
 * column, so the groups are flattened and the key becomes the type. An array is also
 * accepted, because that is what a direct API caller would naturally send.
 */
function toAssets(body: any): CreateApplicationInput['assets'] | undefined {
  const source = body?.assets;
  if (!source) return undefined;

  if (Array.isArray(source)) {
    return source.length > 0 ? source : undefined;
  }

  const groups: Array<[string, string]> = [
    ['properties', 'property'],
    ['vehicles', 'vehicle'],
    ['savings', 'savings'],
    ['investments', 'investments'],
    ['other', 'other'],
  ];

  const assets = groups.flatMap(([key, type]) =>
    (Array.isArray(source[key]) ? source[key] : [])
      // description and value are NOT NULL.
      .filter((a: any) => a?.description && toNumber(a?.value ?? a?.estimatedValue) !== undefined)
      .map((a: any) => ({
        type: present<string>(a.type) ?? type,
        description: a.description,
        value: toNumber(a.value ?? a.estimatedValue)!,
        outstanding: toNumber(a.outstanding ?? a.outstandingFinance) ?? 0,
        isEssential: Boolean(a.isEssential),
      }))
  );

  return assets.length > 0 ? (assets as CreateApplicationInput['assets']) : undefined;
}

/**
 * `incomeExpenditure` → the same, minus the totals.
 *
 * The client sends `totalIncome` and `totalExpenditure` alongside the maps. They are
 * derived values, and storing them would let them contradict the figures they are
 * derived from — so they are dropped and recomputed on read.
 */
function toIncomeExpenditure(body: any): CreateApplicationInput['incomeExpenditure'] | undefined {
  const ie = body?.incomeExpenditure;
  if (!ie?.income && !ie?.expenditure) return undefined;

  return {
    income: ie.income ?? {},
    expenditure: ie.expenditure ?? {},
  };
}

/**
 * Build repository input from a request body.
 *
 * Only keys the client actually sent are present in the result, so a partial save
 * updates only what it touched — an auto-save of the address section must not erase
 * the debts entered on the previous one.
 */
export interface MappingOptions {
  /**
   * Allow `status`, `assignedTo` and `submittedAt` through.
   *
   * Off by default, and that default is load-bearing. `PATCH /:id/status` refuses
   * debtors and enforces `validTransitions`; `PUT /:id` enforced neither, so a debtor
   * who owned a draft — for whom the ownership check legitimately passes — could
   * `PUT {"status":"approved"}` and decide their own sequestration. Ownership cannot
   * catch that, because the owner is exactly who is acting.
   *
   * Creation sets these itself (`status: 'draft'`), and the submit route sets
   * `submittedAt` explicitly, so nothing legitimate needs them from a request body.
   */
  allowLifecycleFields?: boolean;
}

export function toApplicationInput(body: any, options: MappingOptions = {}): CreateApplicationInput {
  const input: CreateApplicationInput = {};

  // Both vocabularies are accepted. The form's is what the `/apply` journey sends;
  // the persistence model's is what a direct API caller sends, and is the shape the
  // published API documentation describes — so translating one must not stop the
  // other from working. Where a caller supplies the persistence shape it is taken
  // as-is and wins, since it is unambiguous.
  const applicant = body?.applicant ?? toApplicant(body);
  if (applicant) input.applicant = applicant;

  const addresses = Array.isArray(body?.addresses) ? body.addresses : toAddresses(body);
  if (addresses) input.addresses = addresses;

  const debts = Array.isArray(body?.debts) ? body.debts : toDebts(body);
  if (debts) input.debts = debts;

  const assets = toAssets(body);
  if (assets) input.assets = assets;

  // The persistence shape for this one is `{ income, expenditure }`, which is also
  // what the form sends (plus derived totals), so a single path covers both.
  const incomeExpenditure = toIncomeExpenditure(body);
  if (incomeExpenditure) input.incomeExpenditure = incomeExpenditure;

  // Fields whose names already match the persistence model, and which any caller may
  // set: these are the applicant's own answers.
  if (body?.systemChecks !== undefined) input.systemChecks = body.systemChecks;
  if (body?.creditCheck !== undefined) input.creditCheck = body.creditCheck;
  if (body?.referenceNumber !== undefined) input.referenceNumber = body.referenceNumber;

  // Lifecycle fields decide the *outcome* of a statutory application, so they are
  // withheld unless the caller explicitly asked for them. See MappingOptions.
  if (options.allowLifecycleFields) {
    if (body?.status !== undefined) input.status = body.status;
    if (body?.assignedTo !== undefined) input.assignedTo = body.assignedTo;
    if (body?.submittedAt !== undefined) input.submittedAt = body.submittedAt;
  }

  // Deliberately never mapped: `debtorUserId`. Ownership comes from the verified token
  // in the route, never from the body — see the create and update handlers.
  return input;
}
