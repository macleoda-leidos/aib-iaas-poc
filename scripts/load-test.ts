/**
 * Simple load test for IAAS API
 * Run: npx tsx scripts/load-test.ts
 */

const API_URL = process.env.API_URL || 'https://iaas-api.onrender.com';
const CONCURRENT = 10;
const TOTAL_REQUESTS = 100;

const ENDPOINTS = [
  '/api/health',
  '/api/applications',
  '/api/organisations',
  '/api/users',
  '/api/roles',
  '/api/audit/events',
];

async function makeRequest(endpoint: string): Promise<{ endpoint: string; status: number; ms: number }> {
  const start = Date.now();
  try {
    const res = await fetch(`${API_URL}${endpoint}`);
    return { endpoint, status: res.status, ms: Date.now() - start };
  } catch (e: any) {
    return { endpoint, status: 0, ms: Date.now() - start };
  }
}

async function run() {
  console.log(`\n🔥 Load Test: ${API_URL}`);
  console.log(`   Concurrent: ${CONCURRENT} | Total: ${TOTAL_REQUESTS}\n`);

  const results: Array<{ endpoint: string; status: number; ms: number }> = [];
  const batches = Math.ceil(TOTAL_REQUESTS / CONCURRENT);

  for (let i = 0; i < batches; i++) {
    const batch = Array.from({ length: CONCURRENT }, () => {
      const ep = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];
      return makeRequest(ep);
    });
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
    process.stdout.write(`   Batch ${i + 1}/${batches} complete (${results.length} requests)\r`);
  }

  console.log('\n\n📊 Results:');
  const successful = results.filter(r => r.status >= 200 && r.status < 400);
  const failed = results.filter(r => r.status === 0 || r.status >= 400);
  const times = successful.map(r => r.ms);
  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  const p95 = times.length ? times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)] : 0;
  const max = times.length ? Math.max(...times) : 0;

  console.log(`   Total requests: ${results.length}`);
  console.log(`   Successful: ${successful.length} (${Math.round(successful.length / results.length * 100)}%)`);
  console.log(`   Failed: ${failed.length}`);
  console.log(`   Avg response: ${avg}ms`);
  console.log(`   P95 response: ${p95}ms`);
  console.log(`   Max response: ${max}ms`);
  console.log(`\n✅ Load test complete\n`);
}

run();
