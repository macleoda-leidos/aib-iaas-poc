import { Router, Request, Response } from 'express';

export const reportsExportRouter = Router();

/**
 * Weekly Report Export - generates a downloadable CSV report
 * with multiple sections mimicking a complex Excel workbook.
 *
 * In production this would use a library like ExcelJS to produce
 * actual .xlsx files with formatting, charts, and multiple sheets.
 * For POC we generate a rich CSV that demonstrates the data structure.
 */
reportsExportRouter.get('/weekly-report', (_req: Request, res: Response) => {
  const reportDate = new Date().toISOString().split('T')[0];
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Build a multi-section CSV report
  let csv = '';

  // ===== HEADER =====
  csv += 'AiB Initial Application Advice Service - Weekly Management Report\n';
  csv += `Report Period:,${weekStart} to ${reportDate}\n`;
  csv += `Generated:,${new Date().toISOString()}\n`;
  csv += `Environment:,POC Demonstration\n`;
  csv += '\n';

  // ===== SECTION 1: EXECUTIVE SUMMARY =====
  csv += '=== EXECUTIVE SUMMARY ===\n';
  csv += 'Metric,This Week,Previous Week,Change,Target\n';
  csv += 'New Applications,47,42,+12%,50\n';
  csv += 'Applications Processed,38,35,+9%,40\n';
  csv += 'Average Processing Time (hours),52,58,-10%,72\n';
  csv += 'Recommendation Accuracy (%),94,92,+2%,90\n';
  csv += 'Customer Satisfaction Score,4.2,4.1,+2%,4.0\n';
  csv += 'SLA Compliance (%),87,84,+4%,85\n';
  csv += '\n';

  // ===== SECTION 2: APPLICATIONS BY STATUS =====
  csv += '=== APPLICATIONS BY STATUS ===\n';
  csv += 'Status,Count,% of Total,Avg Age (days),Oldest (days)\n';
  csv += 'Draft,8,5.1%,2.3,7\n';
  csv += 'Submitted,12,7.7%,1.1,3\n';
  csv += 'Under Review,15,9.6%,3.2,8\n';
  csv += 'Additional Info Required,5,3.2%,5.4,12\n';
  csv += 'Recommendation Issued,28,17.9%,0.5,2\n';
  csv += 'Accepted,72,46.2%,N/A,N/A\n';
  csv += 'Rejected,11,7.1%,N/A,N/A\n';
  csv += 'Withdrawn,5,3.2%,N/A,N/A\n';
  csv += 'TOTAL,156,100%,,\n';
  csv += '\n';

  // ===== SECTION 3: APPLICATIONS BY PRODUCT =====
  csv += '=== RECOMMENDED PRODUCTS BREAKDOWN ===\n';
  csv += 'Product,Count,% of Total,Avg Debt,Avg Income,Avg Disposable,Success Rate\n';
  csv += 'Debt Arrangement Scheme (DAS),45,28.8%,"£15,200","£2,100","£320",89%\n';
  csv += 'Minimal Asset Process (MAP),32,20.5%,"£7,800","£920","£40",94%\n';
  csv += 'Protected Trust Deed (PTD),28,17.9%,"£32,000","£2,400","£280",82%\n';
  csv += 'Sequestration (Bankruptcy),18,11.5%,"£48,000","£1,800","£-50",91%\n';
  csv += 'Debt Payment Programme (DPP),15,9.6%,"£3,500","£1,600","£450",96%\n';
  csv += 'Moratorium,8,5.1%,"£12,000","£1,500","£150",100%\n';
  csv += 'Signposting/Advice,10,6.4%,"£1,200","£1,400","£600",N/A\n';
  csv += '\n';

  // ===== SECTION 4: FINANCIAL ANALYSIS =====
  csv += '=== FINANCIAL ANALYSIS ===\n';
  csv += 'Metric,Total,Average,Median,Min,Max\n';
  csv += `Total Debt Managed,"£2,340,000","£15,000","£12,500","£800","£125,000"\n`;
  csv += `Monthly Payments Arranged,"£45,600","£285","£250","£50","£850"\n`;
  csv += 'Creditor Claims Registered,456,2.9 per case,,1,12\n';
  csv += `Application Fees Collected,"£14,040","£90",,£0,£200\n`;
  csv += `Estimated Annual Recovery,"£547,200","£3,510",,£600,"£10,200"\n`;
  csv += '\n';

  // ===== SECTION 5: INTEGRATION HEALTH =====
  csv += '=== SYSTEM INTEGRATION HEALTH ===\n';
  csv += 'System,Uptime %,Avg Response (ms),Errors,Timeouts,Success Rate\n';
  csv += 'BASYS,99.8%,245,2,0,99.6%\n';
  csv += 'eDEN/DASH,99.5%,312,5,1,98.9%\n';
  csv += 'DAS,99.9%,189,1,0,99.8%\n';
  csv += 'CFT,100%,156,0,0,100%\n';
  csv += 'Moratorium,99.7%,278,3,0,99.4%\n';
  csv += 'RoI,99.6%,298,4,1,99.0%\n';
  csv += 'Credit Check (Synthetic),100%,520,0,0,100%\n';
  csv += '\n';

  // ===== SECTION 6: ORGANISATION ACTIVITY =====
  csv += '=== ORGANISATION ACTIVITY ===\n';
  csv += 'Organisation,Type,Applications Submitted,Approved,Rejected,Pending,Avg Processing Days\n';
  csv += 'Citizens Advice Scotland,Money Adviser,18,15,1,2,3.2\n';
  csv += 'CAS - Edinburgh Bureau,Money Adviser,8,7,0,1,2.8\n';
  csv += 'CAS - Glasgow Bureau,Money Adviser,10,8,1,1,3.5\n';
  csv += 'StepChange Scotland,Money Adviser,12,10,1,1,2.9\n';
  csv += 'Self-Service (Direct),Debtor,17,13,2,2,4.1\n';
  csv += '\n';

  // ===== SECTION 7: STAFF PRODUCTIVITY =====
  csv += '=== STAFF PRODUCTIVITY ===\n';
  csv += 'Officer,Cases Reviewed,Cases Approved,Cases Rejected,Avg Review Time (hrs),Notes Added\n';
  csv += 'Karen MacLeod,12,10,1,4.2,15\n';
  csv += 'James Wilson,15,12,2,3.8,22\n';
  csv += 'System Auto-Process,20,20,0,0.1,0\n';
  csv += '\n';

  // ===== SECTION 8: CREDITOR IMPACT =====
  csv += '=== CREDITOR IMPACT SUMMARY ===\n';
  csv += 'Creditor,Cases Involved,Total Claims,"Dividends Paid (YTD)",Avg Recovery Rate\n';
  csv += `Royal Bank of Scotland,23,"£187,000","£22,440",12%\n`;
  csv += `Barclays Bank,15,"£98,000","£11,760",12%\n`;
  csv += `HMRC Scotland,18,"£134,000","£16,080",12%\n`;
  csv += `Glasgow City Council,12,"£45,000","£5,400",12%\n`;
  csv += `Various Credit Cards,34,"£156,000","£18,720",12%\n`;
  csv += '\n';

  // ===== SECTION 9: COMPLIANCE & RISK =====
  csv += '=== COMPLIANCE & RISK INDICATORS ===\n';
  csv += 'Indicator,Status,Count,Notes\n';
  csv += 'Overdue Reviews,AMBER,3,2 approaching SLA breach\n';
  csv += 'Suspended Organisations,RED,1,Highland Debt Solutions - under investigation\n';
  csv += 'Failed Credit Checks,GREEN,0,All checks completed successfully\n';
  csv += 'Document Scan Failures,GREEN,0,No quarantined documents this week\n';
  csv += 'Duplicate Applications,AMBER,2,Potential duplicates flagged for review\n';
  csv += 'Data Quality Issues,GREEN,1,1 incomplete NI number\n';
  csv += '\n';

  // ===== SECTION 10: FORECAST =====
  csv += '=== 4-WEEK FORECAST ===\n';
  csv += 'Week,Expected Applications,Expected Completions,Capacity Utilisation\n';
  csv += 'Week 1 (next),48,40,85%\n';
  csv += 'Week 2,50,42,88%\n';
  csv += 'Week 3,46,44,92%\n';
  csv += 'Week 4,52,45,94%\n';
  csv += '\n';
  csv += 'END OF REPORT\n';

  // Set headers for CSV download
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="IAAS_Weekly_Report_${reportDate}.csv"`);
  res.setHeader('Content-Length', Buffer.byteLength(csv));
  res.send(csv);
});

// Monthly summary (simpler)
reportsExportRouter.get('/monthly-report', (_req: Request, res: Response) => {
  const reportDate = new Date().toISOString().split('T')[0];
  let csv = 'AiB IAAS - Monthly Summary\n';
  csv += `Month:,${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}\n\n`;
  csv += 'Product,New Cases,Closed Cases,Active Cases,Total Debt Managed\n';
  csv += 'DAS,45,12,120,"£1,824,000"\n';
  csv += 'MAP,32,28,89,"£693,200"\n';
  csv += 'PTD,28,8,65,"£2,080,000"\n';
  csv += 'Sequestration,18,5,42,"£2,016,000"\n';
  csv += 'DPP,15,10,55,"£192,500"\n';

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="IAAS_Monthly_Report_${reportDate}.csv"`);
  res.send(csv);
});
