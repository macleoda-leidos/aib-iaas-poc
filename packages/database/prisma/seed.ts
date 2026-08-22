import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

function loadJSON(filename: string) {
  return JSON.parse(readFileSync(join(__dirname, '..', 'src', 'seed-data', filename), 'utf-8'));
}

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.auditEvent.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.document.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.debt.deleteMany();
  await prisma.incomeExpenditure.deleteMany();
  await prisma.address.deleteMany();
  await prisma.applicant.deleteMany();
  await prisma.application.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.organisation.deleteMany();

  // Seed roles
  const roles = loadJSON('roles.json');
  for (const role of roles) {
    await prisma.role.create({ data: role });
  }
  console.log(`  ✓ ${roles.length} roles`);

  // Seed permissions
  const permissions = loadJSON('permissions.json');
  for (const perm of permissions) {
    await prisma.permission.create({ data: perm });
  }
  console.log(`  ✓ ${permissions.length} permissions`);

  // Seed organisations
  const orgs = loadJSON('organisations.json');
  for (const org of orgs) {
    await prisma.organisation.create({ data: org });
  }
  console.log(`  ✓ ${orgs.length} organisations`);

  // Seed users
  const users = loadJSON('users.json');
  for (const user of users) {
    await prisma.user.create({ data: user });
  }
  console.log(`  ✓ ${users.length} users`);

  // Seed applications with related data
  const applications = loadJSON('applications.json');
  for (const app of applications) {
    const { applicant, addresses, debts, assets, incomeExpenditure, recommendation, ...appData } = app;
    await prisma.application.create({
      data: {
        ...appData,
        applicant: applicant ? { create: applicant } : undefined,
        addresses: addresses ? { create: addresses } : undefined,
        debts: debts ? { create: debts } : undefined,
        assets: assets ? { create: assets } : undefined,
        incomeExpenditure: incomeExpenditure ? { create: incomeExpenditure } : undefined,
        recommendation: recommendation ? { create: recommendation } : undefined,
      },
    });
  }
  console.log(`  ✓ ${applications.length} applications (with related data)`);

  // Seed audit events
  const auditEvents = loadJSON('audit-events.json');
  for (const event of auditEvents) {
    await prisma.auditEvent.create({ data: event });
  }
  console.log(`  ✓ ${auditEvents.length} audit events`);

  console.log('✅ Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
