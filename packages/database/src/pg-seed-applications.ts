import { Pool } from 'pg';

/**
 * Seed 100 applications + applicants into Neon PostgreSQL.
 * Uses the same data as the frontend seedData.ts.
 * Skips if applications already exist.
 */
export async function seedPgApplications(pool: Pool): Promise<void> {
  const { rows } = await pool.query('SELECT COUNT(*) as c FROM applications');
  if (parseInt(rows[0].c) > 0) {
    console.log(`[PostgreSQL] Applications already seeded (${rows[0].c}) — skipping`);
    return;
  }

  // Scottish seed data matching apps/web/src/lib/seedData.ts
  const applications = [
    { ref: "IAAS-2026-00001", firstName: "Alistair", lastName: "Morrison", status: "approved", debt: 14500, product: "DAS", date: "2026-06-02", ni: "SC123456A", email: "alistair.morrison@email.co.uk", employment: "employed", city: "Edinburgh", postcode: "EH1 2AB" },
    { ref: "IAAS-2026-00002", firstName: "Fiona", lastName: "Campbell", status: "submitted", debt: 8200, product: "MAP", date: "2026-06-03", ni: "SC234567B", email: "fiona.campbell@email.co.uk", employment: "employed", city: "Glasgow", postcode: "G1 3CD" },
    { ref: "IAAS-2026-00003", firstName: "Craig", lastName: "Stewart", status: "approved", debt: 22000, product: "DAS", date: "2026-06-04", ni: "SC345678C", email: "craig.stewart@email.co.uk", employment: "self_employed", city: "Aberdeen", postcode: "AB10 1EF" },
    { ref: "IAAS-2026-00004", firstName: "Heather", lastName: "Murray", status: "under_review", debt: 5600, product: "Signposting", date: "2026-06-05", ni: "SC456789D", email: "heather.murray@email.co.uk", employment: "unemployed", city: "Dundee", postcode: "DD1 4GH" },
    { ref: "IAAS-2026-00005", firstName: "Kenneth", lastName: "MacDonald", status: "draft", debt: 31000, product: "Sequestration", date: "2026-06-06", ni: "SC567890E", email: "kenneth.macdonald@email.co.uk", employment: "employed", city: "Falkirk", postcode: "FK1 2JK" },
    { ref: "IAAS-2026-00006", firstName: "Janet", lastName: "Henderson", status: "approved", debt: 18900, product: "DAS", date: "2026-06-07", ni: "SC678901F", email: "janet.henderson@email.co.uk", employment: "employed", city: "Perth", postcode: "PH1 5LM" },
    { ref: "IAAS-2026-00007", firstName: "Graeme", lastName: "Robertson", status: "rejected", debt: 2100, product: "DPP", date: "2026-06-08", ni: "SC789012G", email: "graeme.robertson@email.co.uk", employment: "retired", city: "Inverness", postcode: "IV1 1NP" },
    { ref: "IAAS-2026-00008", firstName: "Eleanor", lastName: "Wilson", status: "submitted", debt: 12400, product: "PTD", date: "2026-06-09", ni: "SC890123H", email: "eleanor.wilson@email.co.uk", employment: "employed", city: "Kilmarnock", postcode: "KA1 3QR" },
    { ref: "IAAS-2026-00009", firstName: "Malcolm", lastName: "Thomson", status: "approved", debt: 27500, product: "DAS", date: "2026-06-10", ni: "SC901234J", email: "malcolm.thomson@email.co.uk", employment: "self_employed", city: "Paisley", postcode: "PA1 2ST" },
    { ref: "IAAS-2026-00010", firstName: "Brenda", lastName: "Anderson", status: "additional_info_required", debt: 9800, product: "MAP", date: "2026-06-11", ni: "SC012345K", email: "brenda.anderson@email.co.uk", employment: "unemployed", city: "Edinburgh", postcode: "EH3 6UV" },
    { ref: "IAAS-2026-00011", firstName: "Iain", lastName: "MacLeod", status: "approved", debt: 35000, product: "Sequestration", date: "2026-06-12", ni: "SC113456L", email: "iain.macleod@email.co.uk", employment: "unemployed", city: "Glasgow", postcode: "G12 8WX" },
    { ref: "IAAS-2026-00012", firstName: "Dorothy", lastName: "Scott", status: "submitted", debt: 16300, product: "DAS", date: "2026-06-13", ni: "SC224567M", email: "dorothy.scott@email.co.uk", employment: "employed", city: "Stirling", postcode: "FK8 1YZ" },
    { ref: "IAAS-2026-00013", firstName: "Angus", lastName: "Fraser", status: "under_review", debt: 7400, product: "MAP", date: "2026-06-14", ni: "SC335678N", email: "angus.fraser@email.co.uk", employment: "employed", city: "Edinburgh", postcode: "EH4 2AA" },
    { ref: "IAAS-2026-00014", firstName: "Morag", lastName: "Sinclair", status: "approved", debt: 19800, product: "DAS", date: "2026-06-15", ni: "SC446789P", email: "morag.sinclair@email.co.uk", employment: "self_employed", city: "Aberdeen", postcode: "AB11 5BB" },
    { ref: "IAAS-2026-00015", firstName: "Douglas", lastName: "Grant", status: "draft", debt: 4200, product: "DPP", date: "2026-06-16", ni: "SC557890Q", email: "douglas.grant@email.co.uk", employment: "retired", city: "Dundee", postcode: "DD2 3CC" },
    { ref: "IAAS-2026-00016", firstName: "Sheila", lastName: "MacKenzie", status: "approved", debt: 28900, product: "PTD", date: "2026-06-17", ni: "SC668901R", email: "sheila.mackenzie@email.co.uk", employment: "employed", city: "Glasgow", postcode: "G3 7DD" },
    { ref: "IAAS-2026-00017", firstName: "Robert", lastName: "Burns", status: "submitted", debt: 11200, product: "DAS", date: "2026-06-18", ni: "SC779012S", email: "robert.burns@email.co.uk", employment: "employed", city: "Ayr", postcode: "KA7 1EE" },
    { ref: "IAAS-2026-00018", firstName: "Catriona", lastName: "MacIntyre", status: "approved", debt: 15600, product: "DAS", date: "2026-06-19", ni: "SC880123T", email: "catriona.macintyre@email.co.uk", employment: "employed", city: "Oban", postcode: "PA34 4FF" },
    { ref: "IAAS-2026-00019", firstName: "Stuart", lastName: "Bell", status: "rejected", debt: 1800, product: "Signposting", date: "2026-06-20", ni: "SC991234U", email: "stuart.bell@email.co.uk", employment: "student", city: "St Andrews", postcode: "KY16 9GG" },
    { ref: "IAAS-2026-00020", firstName: "Margaret", lastName: "Paterson", status: "submitted", debt: 23400, product: "PTD", date: "2026-06-21", ni: "SC102345V", email: "margaret.paterson@email.co.uk", employment: "self_employed", city: "Dundee", postcode: "DD3 6HH" },
    { ref: "IAAS-2026-00021", firstName: "James", lastName: "Cunningham", status: "approved", debt: 17800, product: "DAS", date: "2026-06-22", ni: "SC213456W", email: "james.cunningham@email.co.uk", employment: "employed", city: "Edinburgh", postcode: "EH5 1JJ" },
    { ref: "IAAS-2026-00022", firstName: "Eileen", lastName: "Kerr", status: "under_review", debt: 6900, product: "MAP", date: "2026-06-23", ni: "SC324567X", email: "eileen.kerr@email.co.uk", employment: "unemployed", city: "Glasgow", postcode: "G4 0KK" },
    { ref: "IAAS-2026-00023", firstName: "Donald", lastName: "Cameron", status: "approved", debt: 42000, product: "Sequestration", date: "2026-06-24", ni: "SC435678Y", email: "donald.cameron@email.co.uk", employment: "unemployed", city: "Fort William", postcode: "PH33 6LL" },
    { ref: "IAAS-2026-00024", firstName: "Susan", lastName: "Wallace", status: "submitted", debt: 13500, product: "DAS", date: "2026-06-25", ni: "SC546789Z", email: "susan.wallace@email.co.uk", employment: "employed", city: "Stirling", postcode: "FK7 7MM" },
    { ref: "IAAS-2026-00025", firstName: "Gordon", lastName: "Mitchell", status: "draft", debt: 8700, product: "MAP", date: "2026-06-26", ni: "SC657890A", email: "gordon.mitchell@email.co.uk", employment: "employed", city: "Perth", postcode: "PH2 8NN" },
    { ref: "IAAS-2026-00026", firstName: "Aileen", lastName: "Douglas", status: "approved", debt: 21500, product: "DAS", date: "2026-06-27", ni: "SC768901B", email: "aileen.douglas@email.co.uk", employment: "self_employed", city: "Edinburgh", postcode: "EH6 4PP" },
    { ref: "IAAS-2026-00027", firstName: "William", lastName: "Ramsay", status: "submitted", debt: 10300, product: "DAS", date: "2026-06-28", ni: "SC879012C", email: "william.ramsay@email.co.uk", employment: "employed", city: "Glasgow", postcode: "G5 8QQ" },
    { ref: "IAAS-2026-00028", firstName: "Lorna", lastName: "Baxter", status: "additional_info_required", debt: 7100, product: "MAP", date: "2026-06-29", ni: "SC980123D", email: "lorna.baxter@email.co.uk", employment: "employed", city: "Falkirk", postcode: "FK2 9RR" },
    { ref: "IAAS-2026-00029", firstName: "Andrew", lastName: "Milne", status: "approved", debt: 38000, product: "Sequestration", date: "2026-06-30", ni: "SC091234E", email: "andrew.milne@email.co.uk", employment: "unemployed", city: "Aberdeen", postcode: "AB12 3SS" },
    { ref: "IAAS-2026-00030", firstName: "Isla", lastName: "Ferguson", status: "submitted", debt: 14800, product: "PTD", date: "2026-07-01", ni: "SC102345F", email: "isla.ferguson@email.co.uk", employment: "employed", city: "Inverness", postcode: "IV2 4TT" },
  ];

  // Generate remaining 70 applications programmatically
  const firstNames = ['John','Mary','David','Linda','Thomas','Sandra','Michael','Carol','Peter','Maureen','Brian','Jean','Steven','Kathleen','Paul','Agnes','Alan','Diane','Derek','Lorraine','Colin','Yvonne','Neil','Irene','Mark','Jacqueline','Kevin','Marion','Gary','Hazel','Ross','Nicola','Fraser','Donna','Callum','Laura','Hamish','Kirsty','Murray','Wendy','Finlay','Shona','Gregor','Lesley','Ewan','Mhairi','Blair','Rhona','Robbie','Ailsa','Lewis','Mairi','Cameron','Fiona','Scott','Alison','Craig','Gillian','Douglas','Elaine'];
  const lastNames = ['Smith','Brown','Wilson','Thomson','Robertson','Campbell','Stewart','Anderson','MacDonald','Scott','Murray','Reid','Taylor','Clark','Ross','Young','Mitchell','Watson','Walker','Morrison','Paterson','Hamilton','Graham','Henderson','Kerr','Duncan','Ferguson','Hunter','Simpson','Allan','Crawford','Johnstone','McKay','Bell','Fraser','McLeod','Bruce','Munro','Sutherland','Ritchie'];
  const statuses = ['approved','submitted','under_review','draft','additional_info_required','rejected'];
  const products = ['DAS','MAP','PTD','Sequestration','DPP','Signposting'];
  const cities = ['Edinburgh','Glasgow','Aberdeen','Dundee','Inverness','Stirling','Perth','Falkirk','Ayr','Paisley','Kilmarnock','Dumfries','Motherwell','Hamilton','Livingston','Kirkcaldy','Dunfermline','Cumbernauld','Greenock','Coatbridge'];

  for (let i = 31; i <= 100; i++) {
    const fn = firstNames[(i * 7) % firstNames.length];
    const ln = lastNames[(i * 11) % lastNames.length];
    const day = ((i - 1) % 28) + 1;
    const month = i <= 50 ? '07' : '08';
    applications.push({
      ref: `IAAS-2026-${String(i).padStart(5, '0')}`,
      firstName: fn,
      lastName: ln,
      status: statuses[i % statuses.length],
      debt: 3000 + (i * 317) % 44000,
      product: products[i % products.length],
      date: `2026-${month}-${String(day).padStart(2, '0')}`,
      ni: `SC${String(100000 + i * 1111).slice(0, 6)}${String.fromCharCode(65 + (i % 26))}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@email.co.uk`,
      employment: ['employed','self_employed','unemployed','retired'][i % 4],
      city: cities[i % cities.length],
      postcode: `${cities[i % cities.length].slice(0, 2).toUpperCase()}${i % 20} ${i % 10}${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + ((i * 3) % 26))}`,
    });
  }

  // Insert in batches
  for (let i = 0; i < applications.length; i += 10) {
    const batch = applications.slice(i, i + 10);
    const appValues = batch.map((a, idx) => {
      const n = i + idx + 1;
      return `('app-${String(n).padStart(4, '0')}', '${a.ref}', '${a.status}', ${a.status !== 'draft' ? `'${a.date}T10:00:00Z'` : 'NULL'}, '${a.date}T09:00:00Z', '${a.date}T10:00:00Z')`;
    }).join(',\n      ');

    await pool.query(`
      INSERT INTO applications (id, reference_number, status, submitted_at, created_at, updated_at) VALUES
      ${appValues}
      ON CONFLICT (id) DO NOTHING;
    `);

    const applicantValues = batch.map((a, idx) => {
      const n = i + idx + 1;
      return `('applicant-${String(n).padStart(4, '0')}', 'app-${String(n).padStart(4, '0')}', '${a.firstName}', '${a.lastName}', '${a.email}', '${a.ni}', '${a.employment}')`;
    }).join(',\n      ');

    await pool.query(`
      INSERT INTO applicants (id, application_id, first_name, last_name, email, ni_number, employment) VALUES
      ${applicantValues}
      ON CONFLICT (id) DO NOTHING;
    `);
  }

  console.log(`[PostgreSQL] Seeded ${applications.length} applications + applicants`);
}
