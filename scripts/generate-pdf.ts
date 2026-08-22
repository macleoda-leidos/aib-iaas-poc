/**
 * PDF Prototype Generator
 *
 * Generates an interactive PDF from the /prototype route.
 * Internal anchor links are preserved as clickable hotspots in the output.
 *
 * Usage:
 *   npm run generate:pdf
 *
 * Prerequisites:
 *   - The web app must be running on port 3000 (npm run dev in apps/web)
 *   - Playwright browsers must be installed (npx playwright install chromium)
 */

import { chromium } from 'playwright';

const BASE_URL = process.env.PROTOTYPE_URL || 'http://localhost:3000';
const OUTPUT_PATH = process.env.OUTPUT_PATH || 'docs/AiB-IAAS-Interactive-Prototype.pdf';

async function generatePdf() {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log(`📄 Navigating to ${BASE_URL}/prototype/ ...`);
  await page.goto(`${BASE_URL}/prototype/`, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  // Wait for all content to render
  await page.waitForTimeout(2000);

  console.log('📝 Generating PDF...');
  await page.pdf({
    path: OUTPUT_PATH,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-size: 8px; width: 100%; text-align: center; color: #666; padding: 0 20mm;">
        AiB IAAS — Interactive Prototype — OFFICIAL
      </div>
    `,
    footerTemplate: `
      <div style="font-size: 8px; width: 100%; text-align: center; color: #666; padding: 0 20mm;">
        Page <span class="pageNumber"></span> of <span class="totalPages"></span>
      </div>
    `,
    margin: {
      top: '20mm',
      bottom: '20mm',
      left: '15mm',
      right: '15mm',
    },
  });

  await browser.close();

  console.log(`✅ PDF generated successfully: ${OUTPUT_PATH}`);
  console.log('');
  console.log('📋 Next steps:');
  console.log('   1. Open the PDF in Adobe Acrobat Reader or your browser');
  console.log('   2. Click the Table of Contents links to navigate between screens');
  console.log('   3. Click buttons/links within screens to jump to related pages');
}

generatePdf().catch((error) => {
  console.error('❌ Error generating PDF:', error.message);
  console.error('');
  console.error('Troubleshooting:');
  console.error('  - Is the web app running? (npm run dev in apps/web)');
  console.error('  - Are Playwright browsers installed? (npx playwright install chromium)');
  process.exit(1);
});
