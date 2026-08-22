import { MailroomDocument } from './types';

export const MOCK_DOCUMENTS: MailroomDocument[] = [
  // 1. Court Decree (auto-routed + workflow)
  {
    id: 'doc-001',
    filename: 'Sheriff_Court_Edinburgh_Decree_2026-08-21.pdf',
    receivedAt: '2026-08-21T09:12:00Z',
    source: 'post',
    fileSize: '2.4 MB',
    pages: 4,
    status: 'complete',
    priority: 'high',
    pipeline: {
      virusScan: { status: 'pass', completedAt: '2026-08-21T09:12:05Z' },
      ocr: {
        status: 'complete',
        confidence: 94,
        extractedText: 'SHERIFFDOM OF LOTHIAN AND BORDERS AT EDINBURGH. In the cause Robert James Wallace, residing at 14 Broughton Place, Edinburgh EH1 3RX. The Sheriff, having considered the evidence and submissions, grants decree of sequestration against the debtor. National Insurance Number AB654321C. Total indebtedness £23,450.00. Date of sequestration: 21 August 2026.',
        completedAt: '2026-08-21T09:12:18Z',
      },
      ner: {
        status: 'complete',
        entities: [
          { type: 'person_name', value: 'Robert James Wallace', confidence: 0.97, position: { start: 56, end: 76 } },
          { type: 'ni_number', value: 'AB654321C', confidence: 0.99, position: { start: 245, end: 254 } },
          { type: 'amount', value: '£23,450.00', confidence: 0.98, position: { start: 278, end: 288 } },
          { type: 'court_name', value: 'Edinburgh Sheriff Court', confidence: 0.96, position: { start: 30, end: 53 } },
          { type: 'case_reference', value: 'SEQ-2024-00891', confidence: 0.95, position: { start: 310, end: 324 } },
          { type: 'date', value: '21 August 2026', confidence: 0.99, position: { start: 298, end: 312 } },
        ],
        completedAt: '2026-08-21T09:12:22Z',
      },
      classification: {
        status: 'complete',
        docType: 'Court Decree',
        confidence: 94,
        alternatives: [
          { type: 'Court Order', score: 82 },
          { type: 'Legal Correspondence', score: 45 },
        ],
        completedAt: '2026-08-21T09:12:24Z',
      },
      routing: {
        status: 'routed',
        destination: 'BASYS',
        caseRef: 'SEQ-2024-00891',
        reason: 'Court Decree matched to existing sequestration case via case reference extracted by NER',
        completedAt: '2026-08-21T09:12:26Z',
      },
    },
    workflowTriggered: {
      name: 'Court Decree Received',
      actions: ['Freeze case in BASYS', 'Generate debtor notification letter', 'Assign to Senior Officer queue', 'Update case status to Court Action', 'Create audit event'],
      triggeredAt: '2026-08-21T09:12:27Z',
    },
    caseAllocation: { matched: true, method: 'Case reference (NER)', caseRef: 'SEQ-2024-00891', confidence: 95 },
  },

  // 2. Sequestration Petition (priority)
  {
    id: 'doc-002',
    filename: 'Court_of_Session_Sequestration_Petition.pdf',
    receivedAt: '2026-08-21T08:45:00Z',
    source: 'post',
    fileSize: '3.1 MB',
    pages: 7,
    status: 'complete',
    priority: 'urgent',
    pipeline: {
      virusScan: { status: 'pass', completedAt: '2026-08-21T08:45:06Z' },
      ocr: {
        status: 'complete',
        confidence: 97,
        extractedText: 'COURT OF SESSION, SCOTLAND. PETITION FOR SEQUESTRATION. The petitioner, Highland Credit Union Ltd, seeks sequestration of Margaret Anne Ferguson, 28 Royal Mile, Edinburgh EH1 1TF. Total outstanding debt: £67,890.45. Secondary creditor Caledonian Finance Ltd claims £14,200.00. Apparent insolvency established 3 July 2026.',
        completedAt: '2026-08-21T08:45:21Z',
      },
      ner: {
        status: 'complete',
        entities: [
          { type: 'person_name', value: 'Margaret Anne Ferguson', confidence: 0.98, position: { start: 98, end: 120 } },
          { type: 'court_name', value: 'Court of Session', confidence: 0.99, position: { start: 0, end: 16 } },
          { type: 'amount', value: '£67,890.45', confidence: 0.97, position: { start: 178, end: 188 } },
          { type: 'amount', value: '£14,200.00', confidence: 0.96, position: { start: 235, end: 245 } },
          { type: 'date', value: '3 July 2026', confidence: 0.98, position: { start: 278, end: 289 } },
          { type: 'address', value: '28 Royal Mile, Edinburgh EH1 1TF', confidence: 0.94, position: { start: 122, end: 155 } },
        ],
        completedAt: '2026-08-21T08:45:25Z',
      },
      classification: {
        status: 'complete',
        docType: 'Sequestration Petition',
        confidence: 97,
        alternatives: [
          { type: 'Court Decree', score: 68 },
          { type: 'Legal Correspondence', score: 32 },
        ],
        completedAt: '2026-08-21T08:45:27Z',
      },
      routing: {
        status: 'routed',
        destination: 'Case Management',
        caseRef: 'SEQ-2026-00104',
        reason: 'Sequestration petition triggers statutory clock — routed for immediate processing within 5 working days',
        completedAt: '2026-08-21T08:45:29Z',
      },
    },
    workflowTriggered: {
      name: 'Sequestration Petition Received',
      actions: ['Create new case SEQ-2026-00104', 'Start statutory clock (5 working days)', 'Assign to Senior Officer', 'Notify legal team', 'Create audit event'],
      triggeredAt: '2026-08-21T08:45:30Z',
    },
    caseAllocation: { matched: false, method: 'New case created', caseRef: 'SEQ-2026-00104', confidence: 97 },
  },

  // 3. New Application postal (auto case creation)
  {
    id: 'doc-003',
    filename: 'DAS_Application_Postal_McTavish.pdf',
    receivedAt: '2026-08-21T10:30:00Z',
    source: 'post',
    fileSize: '1.8 MB',
    pages: 6,
    status: 'complete',
    priority: 'normal',
    pipeline: {
      virusScan: { status: 'pass', completedAt: '2026-08-21T10:30:04Z' },
      ocr: {
        status: 'complete',
        confidence: 78,
        extractedText: 'DEBT ARRANGEMENT SCHEME — APPLICATION FORM. Name: Angus McTavish (partially legible, handwritten). Address: 42 [illegible] Street, Glasgow G1 [smudged]. National Insurance: QR789012D. Monthly income: approx £2,100. Total debts listed: £18,500 (handwriting unclear on individual amounts). Signed and dated 18 August 2026.',
        completedAt: '2026-08-21T10:30:22Z',
      },
      ner: {
        status: 'complete',
        entities: [
          { type: 'person_name', value: 'Angus McTavish', confidence: 0.85, position: { start: 52, end: 67 } },
          { type: 'ni_number', value: 'QR789012D', confidence: 0.82, position: { start: 145, end: 154 } },
          { type: 'amount', value: '£2,100', confidence: 0.76, position: { start: 180, end: 186 } },
          { type: 'amount', value: '£18,500', confidence: 0.74, position: { start: 210, end: 217 } },
          { type: 'date', value: '18 August 2026', confidence: 0.88, position: { start: 265, end: 279 } },
        ],
        completedAt: '2026-08-21T10:30:26Z',
      },
      classification: {
        status: 'complete',
        docType: 'DAS Application',
        confidence: 78,
        alternatives: [
          { type: 'DPP Application', score: 62 },
          { type: 'General Correspondence', score: 34 },
        ],
        completedAt: '2026-08-21T10:30:28Z',
      },
      routing: {
        status: 'routed',
        destination: 'IAAS',
        caseRef: 'IAAS-2026-00015',
        reason: 'New DAS application — created draft case in IAAS. Handwritten form requires data entry verification.',
        completedAt: '2026-08-21T10:30:30Z',
      },
    },
    workflowTriggered: {
      name: 'New Application (Post)',
      actions: ['Create draft case IAAS-2026-00015', 'Queue for data entry verification', 'Send acknowledgement letter to applicant', 'Create audit event'],
      triggeredAt: '2026-08-21T10:30:31Z',
    },
    caseAllocation: { matched: false, method: 'New case created (postal application)', caseRef: 'IAAS-2026-00015', confidence: 78 },
  },

  // 4. Bank Statement (auto-matched)
  {
    id: 'doc-004',
    filename: 'NatWest_Statement_Aug2026_Morrison.pdf',
    receivedAt: '2026-08-21T11:05:00Z',
    source: 'email',
    fileSize: '890 KB',
    pages: 3,
    status: 'complete',
    priority: 'normal',
    pipeline: {
      virusScan: { status: 'pass', completedAt: '2026-08-21T11:05:03Z' },
      ocr: {
        status: 'complete',
        confidence: 96,
        extractedText: 'NatWest Bank PLC. Statement of Account. Account Holder: Mrs Catherine Morrison. NI Number: AB123456C. Period: 1 August 2026 to 31 August 2026. Opening Balance: £1,245.67. Closing Balance: £892.34. Total Credits: £2,100.00. Total Debits: £2,453.33.',
        completedAt: '2026-08-21T11:05:14Z',
      },
      ner: {
        status: 'complete',
        entities: [
          { type: 'person_name', value: 'Catherine Morrison', confidence: 0.98, position: { start: 56, end: 74 } },
          { type: 'ni_number', value: 'AB123456C', confidence: 0.99, position: { start: 88, end: 97 } },
          { type: 'amount', value: '£1,245.67', confidence: 0.99, position: { start: 145, end: 154 } },
          { type: 'amount', value: '£892.34', confidence: 0.99, position: { start: 175, end: 182 } },
          { type: 'date', value: '1 August 2026', confidence: 0.99, position: { start: 110, end: 123 } },
        ],
        completedAt: '2026-08-21T11:05:17Z',
      },
      classification: {
        status: 'complete',
        docType: 'Bank Statement',
        confidence: 96,
        alternatives: [
          { type: 'Financial Summary', score: 72 },
          { type: 'Income Evidence', score: 58 },
        ],
        completedAt: '2026-08-21T11:05:18Z',
      },
      routing: {
        status: 'routed',
        destination: 'DAS Register',
        caseRef: 'DAS-2026-00412',
        reason: 'Matched to existing DAS case via NI number AB123456C — income evidence for annual review',
        completedAt: '2026-08-21T11:05:20Z',
      },
    },
    workflowTriggered: {
      name: 'Bank Statement Received',
      actions: ['Attach to case DAS-2026-00412', 'Update income records', 'Flag for annual review assessment', 'Create audit event'],
      triggeredAt: '2026-08-21T11:05:21Z',
    },
    caseAllocation: { matched: true, method: 'NI number match', caseRef: 'DAS-2026-00412', confidence: 99 },
  },

  // 5. Creditor Claim (discrepancy)
  {
    id: 'doc-005',
    filename: 'Barclays_Creditor_Claim_SEQ-2024-00891.pdf',
    receivedAt: '2026-08-21T11:45:00Z',
    source: 'email',
    fileSize: '1.2 MB',
    pages: 2,
    status: 'human_review',
    priority: 'high',
    pipeline: {
      virusScan: { status: 'pass', completedAt: '2026-08-21T11:45:04Z' },
      ocr: {
        status: 'complete',
        confidence: 91,
        extractedText: 'CREDITOR CLAIM FORM. Creditor: Barclays Bank PLC. Case Reference: SEQ-2024-00891. Debtor: Robert James Wallace. Claimed Amount: £12,500.00. Date of last payment: 14 March 2024. Account Number: ****4521. We hereby submit our claim in the sequestration of the above-named debtor.',
        completedAt: '2026-08-21T11:45:15Z',
      },
      ner: {
        status: 'complete',
        entities: [
          { type: 'person_name', value: 'Robert James Wallace', confidence: 0.97, position: { start: 82, end: 102 } },
          { type: 'case_reference', value: 'SEQ-2024-00891', confidence: 0.99, position: { start: 55, end: 69 } },
          { type: 'amount', value: '£12,500.00', confidence: 0.98, position: { start: 120, end: 130 } },
          { type: 'date', value: '14 March 2024', confidence: 0.96, position: { start: 155, end: 168 } },
        ],
        completedAt: '2026-08-21T11:45:18Z',
      },
      classification: {
        status: 'complete',
        docType: 'Creditor Claim',
        confidence: 91,
        alternatives: [
          { type: 'Debt Notification', score: 65 },
          { type: 'Financial Statement', score: 42 },
        ],
        completedAt: '2026-08-21T11:45:20Z',
      },
      routing: {
        status: 'manual',
        destination: 'Case Officer Review',
        caseRef: 'SEQ-2024-00891',
        reason: 'Discrepancy detected: claimed amount £12,500.00 does not match case record £8,200.00 — requires manual verification',
        completedAt: '2026-08-21T11:45:22Z',
      },
    },
    caseAllocation: { matched: true, method: 'Case reference (NER)', caseRef: 'SEQ-2024-00891', confidence: 99 },
  },

  // 6. Damaged document (low confidence)
  {
    id: 'doc-006',
    filename: 'Damaged_Photocopy_Unknown.pdf',
    receivedAt: '2026-08-21T12:00:00Z',
    source: 'post',
    fileSize: '3.8 MB',
    pages: 2,
    status: 'human_review',
    priority: 'normal',
    pipeline: {
      virusScan: { status: 'pass', completedAt: '2026-08-21T12:00:05Z' },
      ocr: {
        status: 'complete',
        confidence: 52,
        extractedText: '[heavily degraded scan] ...ank [illegible]... payment of £... [torn section]... dated [smudged] 2026... reference num... [rest of page unreadable due to water damage and fold marks]',
        completedAt: '2026-08-21T12:00:20Z',
      },
      ner: {
        status: 'complete',
        entities: [
          { type: 'amount', value: '£', confidence: 0.32, position: { start: 45, end: 46 } },
          { type: 'date', value: '2026', confidence: 0.41, position: { start: 78, end: 82 } },
        ],
        completedAt: '2026-08-21T12:00:23Z',
      },
      classification: {
        status: 'complete',
        docType: 'Unknown (possible correspondence)',
        confidence: 52,
        alternatives: [
          { type: 'Bank Statement', score: 48 },
          { type: 'Creditor Claim', score: 35 },
          { type: 'General Correspondence', score: 32 },
        ],
        completedAt: '2026-08-21T12:00:25Z',
      },
      routing: {
        status: 'manual',
        destination: 'Manual Classification Queue',
        caseRef: undefined,
        reason: 'OCR confidence below threshold (52%) — document too damaged for automated processing',
        completedAt: '2026-08-21T12:00:26Z',
      },
    },
    caseAllocation: { matched: false, method: 'Unable to match — insufficient data extracted', confidence: 0 },
  },

  // 7. Glasgow Sheriff Court Order
  {
    id: 'doc-007',
    filename: 'Glasgow_Sheriff_Court_Order_Patterson.pdf',
    receivedAt: '2026-08-21T08:20:00Z',
    source: 'post',
    fileSize: '1.9 MB',
    pages: 3,
    status: 'complete',
    priority: 'high',
    pipeline: {
      virusScan: { status: 'pass', completedAt: '2026-08-21T08:20:04Z' },
      ocr: {
        status: 'complete',
        confidence: 92,
        extractedText: 'SHERIFFDOM OF GLASGOW AND STRATHKELVIN. Court Order regarding James Patterson, 67 Sauchiehall Street, Glasgow G2 3AT. The court orders the debtor to comply with the payment plan under DAS reference DAS-2025-00789. Monthly payment: £345.00.',
        completedAt: '2026-08-21T08:20:16Z',
      },
      ner: {
        status: 'complete',
        entities: [
          { type: 'person_name', value: 'James Patterson', confidence: 0.96, position: { start: 52, end: 67 } },
          { type: 'court_name', value: 'Glasgow Sheriff Court', confidence: 0.97, position: { start: 14, end: 35 } },
          { type: 'case_reference', value: 'DAS-2025-00789', confidence: 0.94, position: { start: 156, end: 170 } },
          { type: 'amount', value: '£345.00', confidence: 0.98, position: { start: 195, end: 202 } },
          { type: 'address', value: '67 Sauchiehall Street, Glasgow G2 3AT', confidence: 0.93, position: { start: 69, end: 106 } },
        ],
        completedAt: '2026-08-21T08:20:20Z',
      },
      classification: {
        status: 'complete',
        docType: 'Court Order',
        confidence: 92,
        alternatives: [
          { type: 'Court Decree', score: 78 },
          { type: 'Legal Correspondence', score: 40 },
        ],
        completedAt: '2026-08-21T08:20:22Z',
      },
      routing: {
        status: 'routed',
        destination: 'DAS Register',
        caseRef: 'DAS-2025-00789',
        reason: 'Court order related to existing DAS case — matched via case reference',
        completedAt: '2026-08-21T08:20:24Z',
      },
    },
    caseAllocation: { matched: true, method: 'Case reference (NER)', caseRef: 'DAS-2025-00789', confidence: 94 },
  },

  // 8. Halifax Bank Statement
  {
    id: 'doc-008',
    filename: 'Halifax_Statement_Jul2026_Campbell.pdf',
    receivedAt: '2026-08-21T09:50:00Z',
    source: 'email',
    fileSize: '720 KB',
    pages: 2,
    status: 'complete',
    priority: 'normal',
    pipeline: {
      virusScan: { status: 'pass', completedAt: '2026-08-21T09:50:03Z' },
      ocr: {
        status: 'complete',
        confidence: 98,
        extractedText: 'Halifax Bank. Monthly Statement. Account Holder: Donald Campbell. NI: CD345678E. Period: July 2026. Opening Balance: £3,456.78. Closing Balance: £2,890.12. Salary Credit: £2,800.00 on 28th.',
        completedAt: '2026-08-21T09:50:11Z',
      },
      ner: {
        status: 'complete',
        entities: [
          { type: 'person_name', value: 'Donald Campbell', confidence: 0.99, position: { start: 44, end: 59 } },
          { type: 'ni_number', value: 'CD345678E', confidence: 0.99, position: { start: 65, end: 74 } },
          { type: 'amount', value: '£3,456.78', confidence: 0.99, position: { start: 110, end: 119 } },
          { type: 'amount', value: '£2,890.12', confidence: 0.99, position: { start: 140, end: 149 } },
        ],
        completedAt: '2026-08-21T09:50:14Z',
      },
      classification: {
        status: 'complete',
        docType: 'Bank Statement',
        confidence: 98,
        alternatives: [
          { type: 'Financial Summary', score: 65 },
        ],
        completedAt: '2026-08-21T09:50:15Z',
      },
      routing: {
        status: 'routed',
        destination: 'DAS Register',
        caseRef: 'DAS-2026-00398',
        reason: 'Matched to existing DAS case via NI number CD345678E',
        completedAt: '2026-08-21T09:50:17Z',
      },
    },
    workflowTriggered: {
      name: 'Bank Statement Received',
      actions: ['Attach to case DAS-2026-00398', 'Update income records', 'Flag for annual review assessment', 'Create audit event'],
      triggeredAt: '2026-08-21T09:50:18Z',
    },
    caseAllocation: { matched: true, method: 'NI number match', caseRef: 'DAS-2026-00398', confidence: 99 },
  },

  // 9. Aberdeen Sheriff Court Decree
  {
    id: 'doc-009',
    filename: 'Aberdeen_Sheriff_Court_Decree_MacLeod.pdf',
    receivedAt: '2026-08-21T07:55:00Z',
    source: 'post',
    fileSize: '2.1 MB',
    pages: 5,
    status: 'complete',
    priority: 'high',
    pipeline: {
      virusScan: { status: 'pass', completedAt: '2026-08-21T07:55:05Z' },
      ocr: {
        status: 'complete',
        confidence: 89,
        extractedText: 'SHERIFFDOM OF GRAMPIAN, HIGHLAND AND ISLANDS AT ABERDEEN. Decree of sequestration pronounced against Fiona MacLeod, NI EF567890G. Total debt: £41,200.00. The debtor resides at 15 Union Street, Aberdeen AB10 1QS.',
        completedAt: '2026-08-21T07:55:19Z',
      },
      ner: {
        status: 'complete',
        entities: [
          { type: 'person_name', value: 'Fiona MacLeod', confidence: 0.95, position: { start: 85, end: 98 } },
          { type: 'ni_number', value: 'EF567890G', confidence: 0.98, position: { start: 103, end: 112 } },
          { type: 'amount', value: '£41,200.00', confidence: 0.97, position: { start: 126, end: 136 } },
          { type: 'court_name', value: 'Aberdeen Sheriff Court', confidence: 0.96, position: { start: 44, end: 66 } },
          { type: 'address', value: '15 Union Street, Aberdeen AB10 1QS', confidence: 0.92, position: { start: 165, end: 200 } },
        ],
        completedAt: '2026-08-21T07:55:23Z',
      },
      classification: {
        status: 'complete',
        docType: 'Court Decree',
        confidence: 89,
        alternatives: [
          { type: 'Court Order', score: 74 },
          { type: 'Sequestration Petition', score: 55 },
        ],
        completedAt: '2026-08-21T07:55:25Z',
      },
      routing: {
        status: 'routed',
        destination: 'BASYS',
        caseRef: 'SEQ-2026-00098',
        reason: 'Court Decree for new sequestration — case created and routed to BASYS',
        completedAt: '2026-08-21T07:55:27Z',
      },
    },
    workflowTriggered: {
      name: 'Court Decree Received',
      actions: ['Create case SEQ-2026-00098', 'Generate debtor notification letter', 'Assign to Senior Officer queue', 'Update case status to Court Action', 'Create audit event'],
      triggeredAt: '2026-08-21T07:55:28Z',
    },
    caseAllocation: { matched: false, method: 'New case created', caseRef: 'SEQ-2026-00098', confidence: 89 },
  },

  // 10. RBS Statement
  {
    id: 'doc-010',
    filename: 'RBS_Statement_Aug2026_Henderson.pdf',
    receivedAt: '2026-08-21T10:15:00Z',
    source: 'portal_upload',
    fileSize: '650 KB',
    pages: 2,
    status: 'complete',
    priority: 'normal',
    pipeline: {
      virusScan: { status: 'pass', completedAt: '2026-08-21T10:15:02Z' },
      ocr: {
        status: 'complete',
        confidence: 97,
        extractedText: 'Royal Bank of Scotland. Account Statement for Graham Henderson, NI GH901234F. Period: 1-31 August 2026. Opening: £567.89. Closing: £234.56. Total income: £1,950.00.',
        completedAt: '2026-08-21T10:15:10Z',
      },
      ner: {
        status: 'complete',
        entities: [
          { type: 'person_name', value: 'Graham Henderson', confidence: 0.99, position: { start: 42, end: 58 } },
          { type: 'ni_number', value: 'GH901234F', confidence: 0.99, position: { start: 63, end: 72 } },
          { type: 'amount', value: '£567.89', confidence: 0.99, position: { start: 110, end: 117 } },
          { type: 'amount', value: '£1,950.00', confidence: 0.99, position: { start: 155, end: 164 } },
        ],
        completedAt: '2026-08-21T10:15:13Z',
      },
      classification: {
        status: 'complete',
        docType: 'Bank Statement',
        confidence: 97,
        alternatives: [
          { type: 'Financial Summary', score: 70 },
        ],
        completedAt: '2026-08-21T10:15:14Z',
      },
      routing: {
        status: 'routed',
        destination: 'DAS Register',
        caseRef: 'DAS-2026-00445',
        reason: 'Matched to existing DAS case via NI number GH901234F — supporting document for review',
        completedAt: '2026-08-21T10:15:16Z',
      },
    },
    caseAllocation: { matched: true, method: 'NI number match', caseRef: 'DAS-2026-00445', confidence: 99 },
  },

  // 11. Creditor Claim - HSBC
  {
    id: 'doc-011',
    filename: 'HSBC_Creditor_Claim_SEQ-2026-00098.pdf',
    receivedAt: '2026-08-21T13:20:00Z',
    source: 'email',
    fileSize: '980 KB',
    pages: 2,
    status: 'complete',
    priority: 'normal',
    pipeline: {
      virusScan: { status: 'pass', completedAt: '2026-08-21T13:20:03Z' },
      ocr: {
        status: 'complete',
        confidence: 93,
        extractedText: 'HSBC UK. Creditor Claim. Re: Sequestration of Fiona MacLeod, Case SEQ-2026-00098. We claim the sum of £8,750.00 being the outstanding balance on credit card account ending 7823. Last payment received 22 January 2026.',
        completedAt: '2026-08-21T13:20:14Z',
      },
      ner: {
        status: 'complete',
        entities: [
          { type: 'person_name', value: 'Fiona MacLeod', confidence: 0.97, position: { start: 42, end: 55 } },
          { type: 'case_reference', value: 'SEQ-2026-00098', confidence: 0.99, position: { start: 62, end: 76 } },
          { type: 'amount', value: '£8,750.00', confidence: 0.98, position: { start: 98, end: 107 } },
          { type: 'date', value: '22 January 2026', confidence: 0.96, position: { start: 172, end: 187 } },
        ],
        completedAt: '2026-08-21T13:20:17Z',
      },
      classification: {
        status: 'complete',
        docType: 'Creditor Claim',
        confidence: 93,
        alternatives: [
          { type: 'Debt Notification', score: 68 },
          { type: 'Financial Statement', score: 38 },
        ],
        completedAt: '2026-08-21T13:20:19Z',
      },
      routing: {
        status: 'routed',
        destination: 'BASYS',
        caseRef: 'SEQ-2026-00098',
        reason: 'Creditor claim matched to existing case via case reference — amount within expected range',
        completedAt: '2026-08-21T13:20:21Z',
      },
    },
    workflowTriggered: {
      name: 'Creditor Claim Received',
      actions: ['Attach claim to case SEQ-2026-00098', 'Update creditor register', 'Notify trustee', 'Create audit event'],
      triggeredAt: '2026-08-21T13:20:22Z',
    },
    caseAllocation: { matched: true, method: 'Case reference (NER)', caseRef: 'SEQ-2026-00098', confidence: 99 },
  },

  // 12. Identity Document
  {
    id: 'doc-012',
    filename: 'Passport_Copy_Anderson.pdf',
    receivedAt: '2026-08-21T14:00:00Z',
    source: 'portal_upload',
    fileSize: '1.5 MB',
    pages: 1,
    status: 'complete',
    priority: 'normal',
    pipeline: {
      virusScan: { status: 'pass', completedAt: '2026-08-21T14:00:02Z' },
      ocr: {
        status: 'complete',
        confidence: 88,
        extractedText: 'UNITED KINGDOM OF GREAT BRITAIN AND NORTHERN IRELAND. PASSPORT. Surname: ANDERSON. Given names: KAREN ELIZABETH. Date of birth: 15 MAR 1985. Place of birth: DUNDEE. Expiry: 22 SEP 2031.',
        completedAt: '2026-08-21T14:00:09Z',
      },
      ner: {
        status: 'complete',
        entities: [
          { type: 'person_name', value: 'Karen Elizabeth Anderson', confidence: 0.97, position: { start: 78, end: 101 } },
          { type: 'date', value: '15 MAR 1985', confidence: 0.99, position: { start: 118, end: 129 } },
          { type: 'date', value: '22 SEP 2031', confidence: 0.99, position: { start: 162, end: 173 } },
        ],
        completedAt: '2026-08-21T14:00:12Z',
      },
      classification: {
        status: 'complete',
        docType: 'Identity Document',
        confidence: 88,
        alternatives: [
          { type: 'Proof of Address', score: 32 },
        ],
        completedAt: '2026-08-21T14:00:13Z',
      },
      routing: {
        status: 'routed',
        destination: 'IAAS',
        caseRef: 'IAAS-2026-00012',
        reason: 'Identity document matched to pending application via name match — Karen Anderson',
        completedAt: '2026-08-21T14:00:15Z',
      },
    },
    caseAllocation: { matched: true, method: 'Name match (fuzzy)', caseRef: 'IAAS-2026-00012', confidence: 87 },
  },

  // 13. DAS Review Form
  {
    id: 'doc-013',
    filename: 'DAS_Annual_Review_Form_Thompson.pdf',
    receivedAt: '2026-08-21T09:30:00Z',
    source: 'post',
    fileSize: '1.1 MB',
    pages: 4,
    status: 'complete',
    priority: 'normal',
    pipeline: {
      virusScan: { status: 'pass', completedAt: '2026-08-21T09:30:04Z' },
      ocr: {
        status: 'complete',
        confidence: 85,
        extractedText: 'DEBT ARRANGEMENT SCHEME — ANNUAL REVIEW FORM. Debtor: Ian Thompson, NI IJ456789K. Case ref: DAS-2025-00567. Current monthly payment: £425.00. Change in circumstances: YES — salary increase. New monthly income: £2,650.00.',
        completedAt: '2026-08-21T09:30:16Z',
      },
      ner: {
        status: 'complete',
        entities: [
          { type: 'person_name', value: 'Ian Thompson', confidence: 0.96, position: { start: 52, end: 64 } },
          { type: 'ni_number', value: 'IJ456789K', confidence: 0.98, position: { start: 69, end: 78 } },
          { type: 'case_reference', value: 'DAS-2025-00567', confidence: 0.97, position: { start: 90, end: 104 } },
          { type: 'amount', value: '£425.00', confidence: 0.95, position: { start: 132, end: 139 } },
          { type: 'amount', value: '£2,650.00', confidence: 0.94, position: { start: 198, end: 207 } },
        ],
        completedAt: '2026-08-21T09:30:19Z',
      },
      classification: {
        status: 'complete',
        docType: 'DAS Review Form',
        confidence: 85,
        alternatives: [
          { type: 'DAS Application', score: 60 },
          { type: 'Change of Circumstances', score: 55 },
        ],
        completedAt: '2026-08-21T09:30:21Z',
      },
      routing: {
        status: 'routed',
        destination: 'DAS Register',
        caseRef: 'DAS-2025-00567',
        reason: 'Annual review matched to existing DAS case — change in circumstances noted, payment review required',
        completedAt: '2026-08-21T09:30:23Z',
      },
    },
    caseAllocation: { matched: true, method: 'Case reference (NER)', caseRef: 'DAS-2025-00567', confidence: 97 },
  },

  // 14. Correspondence Letter
  {
    id: 'doc-014',
    filename: 'Debtor_Correspondence_Wilson.pdf',
    receivedAt: '2026-08-21T11:30:00Z',
    source: 'post',
    fileSize: '540 KB',
    pages: 1,
    status: 'complete',
    priority: 'normal',
    pipeline: {
      virusScan: { status: 'pass', completedAt: '2026-08-21T11:30:03Z' },
      ocr: {
        status: 'complete',
        confidence: 82,
        extractedText: 'Dear Sir/Madam, I am writing regarding my sequestration case SEQ-2025-00234. I have recently moved address to 45 High Street, Inverness IV1 1QA and wish to update my records. Yours faithfully, David Wilson.',
        completedAt: '2026-08-21T11:30:12Z',
      },
      ner: {
        status: 'complete',
        entities: [
          { type: 'person_name', value: 'David Wilson', confidence: 0.94, position: { start: 185, end: 197 } },
          { type: 'case_reference', value: 'SEQ-2025-00234', confidence: 0.98, position: { start: 56, end: 70 } },
          { type: 'address', value: '45 High Street, Inverness IV1 1QA', confidence: 0.91, position: { start: 108, end: 142 } },
        ],
        completedAt: '2026-08-21T11:30:15Z',
      },
      classification: {
        status: 'complete',
        docType: 'General Correspondence',
        confidence: 82,
        alternatives: [
          { type: 'Change of Circumstances', score: 72 },
          { type: 'Address Update', score: 68 },
        ],
        completedAt: '2026-08-21T11:30:17Z',
      },
      routing: {
        status: 'routed',
        destination: 'BASYS',
        caseRef: 'SEQ-2025-00234',
        reason: 'Correspondence matched to existing case — address change request forwarded to case officer',
        completedAt: '2026-08-21T11:30:19Z',
      },
    },
    caseAllocation: { matched: true, method: 'Case reference (NER)', caseRef: 'SEQ-2025-00234', confidence: 98 },
  },

  // 15. Dundee Court Decree
  {
    id: 'doc-015',
    filename: 'Dundee_Sheriff_Court_Decree_Fraser.pdf',
    receivedAt: '2026-08-20T16:40:00Z',
    source: 'post',
    fileSize: '2.3 MB',
    pages: 4,
    status: 'complete',
    priority: 'high',
    pipeline: {
      virusScan: { status: 'pass', completedAt: '2026-08-20T16:40:05Z' },
      ocr: {
        status: 'complete',
        confidence: 91,
        extractedText: 'SHERIFFDOM OF TAYSIDE, CENTRAL AND FIFE AT DUNDEE. Decree of sequestration against Kenneth Fraser, NI KL678901M. Residing at 8 Reform Street, Dundee DD1 1RG. Total debts: £29,800.00. Decree date: 19 August 2026.',
        completedAt: '2026-08-20T16:40:18Z',
      },
      ner: {
        status: 'complete',
        entities: [
          { type: 'person_name', value: 'Kenneth Fraser', confidence: 0.96, position: { start: 62, end: 76 } },
          { type: 'ni_number', value: 'KL678901M', confidence: 0.98, position: { start: 81, end: 90 } },
          { type: 'court_name', value: 'Dundee Sheriff Court', confidence: 0.95, position: { start: 38, end: 58 } },
          { type: 'amount', value: '£29,800.00', confidence: 0.97, position: { start: 155, end: 165 } },
          { type: 'address', value: '8 Reform Street, Dundee DD1 1RG', confidence: 0.93, position: { start: 105, end: 137 } },
          { type: 'date', value: '19 August 2026', confidence: 0.99, position: { start: 180, end: 194 } },
        ],
        completedAt: '2026-08-20T16:40:22Z',
      },
      classification: {
        status: 'complete',
        docType: 'Court Decree',
        confidence: 91,
        alternatives: [
          { type: 'Court Order', score: 76 },
          { type: 'Legal Correspondence', score: 38 },
        ],
        completedAt: '2026-08-20T16:40:24Z',
      },
      routing: {
        status: 'routed',
        destination: 'BASYS',
        caseRef: 'SEQ-2026-00102',
        reason: 'New sequestration decree — case created and assigned',
        completedAt: '2026-08-20T16:40:26Z',
      },
    },
    workflowTriggered: {
      name: 'Court Decree Received',
      actions: ['Create case SEQ-2026-00102', 'Generate debtor notification letter', 'Assign to Senior Officer queue', 'Update case status to Court Action', 'Create audit event'],
      triggeredAt: '2026-08-20T16:40:27Z',
    },
    caseAllocation: { matched: false, method: 'New case created', caseRef: 'SEQ-2026-00102', confidence: 91 },
  },

  // 16. Clydesdale Bank Statement
  {
    id: 'doc-016',
    filename: 'Clydesdale_Statement_Jul2026_Murray.pdf',
    receivedAt: '2026-08-21T10:50:00Z',
    source: 'email',
    fileSize: '780 KB',
    pages: 3,
    status: 'complete',
    priority: 'normal',
    pipeline: {
      virusScan: { status: 'pass', completedAt: '2026-08-21T10:50:03Z' },
      ocr: {
        status: 'complete',
        confidence: 95,
        extractedText: 'Clydesdale Bank. Statement for Susan Murray, NI MN234567O. Account: Current. Period: July 2026. Opening: £1,892.45. Closing: £1,123.67. Salary received: £2,400.00 (monthly). Mortgage payment: £895.00.',
        completedAt: '2026-08-21T10:50:12Z',
      },
      ner: {
        status: 'complete',
        entities: [
          { type: 'person_name', value: 'Susan Murray', confidence: 0.98, position: { start: 32, end: 44 } },
          { type: 'ni_number', value: 'MN234567O', confidence: 0.99, position: { start: 49, end: 58 } },
          { type: 'amount', value: '£1,892.45', confidence: 0.99, position: { start: 98, end: 107 } },
          { type: 'amount', value: '£2,400.00', confidence: 0.99, position: { start: 142, end: 151 } },
          { type: 'amount', value: '£895.00', confidence: 0.99, position: { start: 178, end: 185 } },
        ],
        completedAt: '2026-08-21T10:50:15Z',
      },
      classification: {
        status: 'complete',
        docType: 'Bank Statement',
        confidence: 95,
        alternatives: [
          { type: 'Financial Summary', score: 68 },
          { type: 'Income Evidence', score: 55 },
        ],
        completedAt: '2026-08-21T10:50:17Z',
      },
      routing: {
        status: 'routed',
        destination: 'DAS Register',
        caseRef: 'DAS-2025-00901',
        reason: 'Matched to existing DAS case via NI number MN234567O',
        completedAt: '2026-08-21T10:50:19Z',
      },
    },
    caseAllocation: { matched: true, method: 'NI number match', caseRef: 'DAS-2025-00901', confidence: 99 },
  },

  // 17. Currently scanning
  {
    id: 'doc-017',
    filename: 'Incoming_Post_Batch_2026-08-21_PM.pdf',
    receivedAt: '2026-08-21T14:30:00Z',
    source: 'post',
    fileSize: '5.2 MB',
    pages: 12,
    status: 'scanning',
    priority: 'normal',
    pipeline: {
      virusScan: { status: 'pending' },
      ocr: { status: 'pending', confidence: 0 },
      ner: { status: 'pending', entities: [] },
      classification: { status: 'pending', docType: '', confidence: 0 },
      routing: { status: 'pending', destination: '', reason: '' },
    },
  },

  // 18. In OCR processing
  {
    id: 'doc-018',
    filename: 'Court_Letter_Stirling_2026-08-21.pdf',
    receivedAt: '2026-08-21T14:15:00Z',
    source: 'post',
    fileSize: '1.4 MB',
    pages: 2,
    status: 'ocr_processing',
    priority: 'normal',
    pipeline: {
      virusScan: { status: 'pass', completedAt: '2026-08-21T14:15:04Z' },
      ocr: { status: 'pending', confidence: 0 },
      ner: { status: 'pending', entities: [] },
      classification: { status: 'pending', docType: '', confidence: 0 },
      routing: { status: 'pending', destination: '', reason: '' },
    },
  },

  // 19. Creditor Claim - Santander
  {
    id: 'doc-019',
    filename: 'Santander_Creditor_Claim_DAS-2025-00567.pdf',
    receivedAt: '2026-08-21T12:45:00Z',
    source: 'email',
    fileSize: '1.0 MB',
    pages: 2,
    status: 'complete',
    priority: 'normal',
    pipeline: {
      virusScan: { status: 'pass', completedAt: '2026-08-21T12:45:03Z' },
      ocr: {
        status: 'complete',
        confidence: 94,
        extractedText: 'Santander UK PLC. Creditor Claim Form. Debtor: Ian Thompson. Case: DAS-2025-00567. Outstanding balance on personal loan: £6,200.00. Monthly instalment due: £180.00. Last payment received: 1 June 2026.',
        completedAt: '2026-08-21T12:45:13Z',
      },
      ner: {
        status: 'complete',
        entities: [
          { type: 'person_name', value: 'Ian Thompson', confidence: 0.97, position: { start: 48, end: 60 } },
          { type: 'case_reference', value: 'DAS-2025-00567', confidence: 0.99, position: { start: 68, end: 82 } },
          { type: 'amount', value: '£6,200.00', confidence: 0.98, position: { start: 118, end: 127 } },
          { type: 'amount', value: '£180.00', confidence: 0.97, position: { start: 152, end: 159 } },
          { type: 'date', value: '1 June 2026', confidence: 0.96, position: { start: 182, end: 193 } },
        ],
        completedAt: '2026-08-21T12:45:16Z',
      },
      classification: {
        status: 'complete',
        docType: 'Creditor Claim',
        confidence: 94,
        alternatives: [
          { type: 'Debt Notification', score: 62 },
          { type: 'Financial Statement', score: 40 },
        ],
        completedAt: '2026-08-21T12:45:18Z',
      },
      routing: {
        status: 'routed',
        destination: 'DAS Register',
        caseRef: 'DAS-2025-00567',
        reason: 'Creditor claim matched to existing DAS case via case reference — amount consistent with records',
        completedAt: '2026-08-21T12:45:20Z',
      },
    },
    workflowTriggered: {
      name: 'Creditor Claim Received',
      actions: ['Attach claim to case DAS-2025-00567', 'Update creditor register', 'Notify payment distributor', 'Create audit event'],
      triggeredAt: '2026-08-21T12:45:21Z',
    },
    caseAllocation: { matched: true, method: 'Case reference (NER)', caseRef: 'DAS-2025-00567', confidence: 99 },
  },

  // 20. Fax - low-medium confidence
  {
    id: 'doc-020',
    filename: 'Fax_Creditor_Notification_Unknown.pdf',
    receivedAt: '2026-08-21T13:50:00Z',
    source: 'fax',
    fileSize: '420 KB',
    pages: 1,
    status: 'complete',
    priority: 'normal',
    pipeline: {
      virusScan: { status: 'pass', completedAt: '2026-08-21T13:50:03Z' },
      ocr: {
        status: 'complete',
        confidence: 67,
        extractedText: 'FAX TRANSMISSION. From: [partially legible] Finance Ltd. Re: Account [smudged]. We write to advise that the balance outstanding is approximately £3,400. Please contact us at your earliest convenience. Ref: [faded].',
        completedAt: '2026-08-21T13:50:14Z',
      },
      ner: {
        status: 'complete',
        entities: [
          { type: 'amount', value: '£3,400', confidence: 0.78, position: { start: 128, end: 134 } },
        ],
        completedAt: '2026-08-21T13:50:17Z',
      },
      classification: {
        status: 'complete',
        docType: 'Creditor Notification',
        confidence: 67,
        alternatives: [
          { type: 'Creditor Claim', score: 58 },
          { type: 'General Correspondence', score: 52 },
        ],
        completedAt: '2026-08-21T13:50:19Z',
      },
      routing: {
        status: 'routed',
        destination: 'General Inbox',
        reason: 'Low confidence classification and no case identifiers found — routed to general inbox for manual triage',
        completedAt: '2026-08-21T13:50:21Z',
      },
    },
    caseAllocation: { matched: false, method: 'No matching identifiers found', confidence: 0 },
  },
];
