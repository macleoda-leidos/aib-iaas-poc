import { seedApplications } from '../../../lib/seedData';

/**
 * Refs to pre-render for /case/[ref] and its sub-routes.
 *
 * Derived from the seed data rather than written out, because the two had
 * already drifted: the parent route listed 50 refs while seedData defines 100,
 * and the audit and recommendation sub-routes listed only 4. Search results and
 * dashboard rows link to every seeded ref, and case detail renders links to both
 * sub-routes unconditionally — so with `output: 'export'` and no fallback, half
 * the searchable dataset 404'd on click and 46 of 50 cases had two dead links.
 *
 * Deriving from one source means adding a seed application cannot reintroduce
 * that class of bug.
 */
export function caseStaticParams() {
  return seedApplications.map(app => ({ ref: app.ref }));
}
