export type DocumentSource = 'post' | 'email' | 'fax' | 'portal_upload';
export type DocumentStatus = 'scanning' | 'ocr_processing' | 'classifying' | 'routing' | 'complete' | 'human_review' | 'failed';
export type NEREntityType = 'person_name' | 'ni_number' | 'amount' | 'date' | 'address' | 'case_reference' | 'court_name';

export interface NEREntity {
  type: NEREntityType;
  value: string;
  confidence: number;
  position?: { start: number; end: number };
}

export interface PipelineStage {
  status: 'pass' | 'fail' | 'complete' | 'pending' | 'failed';
  completedAt?: string;
}

export interface MailroomDocument {
  id: string;
  filename: string;
  receivedAt: string;
  source: DocumentSource;
  fileSize: string;
  pages: number;
  status: DocumentStatus;
  priority: 'normal' | 'high' | 'urgent';
  pipeline: {
    virusScan: { status: 'pass' | 'fail' | 'pending'; completedAt?: string };
    ocr: { status: 'complete' | 'pending' | 'failed'; confidence: number; extractedText?: string; completedAt?: string };
    ner: { status: 'complete' | 'pending'; entities: NEREntity[]; completedAt?: string };
    classification: { status: 'complete' | 'pending'; docType: string; confidence: number; alternatives?: Array<{ type: string; score: number }>; completedAt?: string };
    routing: { status: 'routed' | 'pending' | 'manual'; destination: string; caseRef?: string; reason: string; completedAt?: string };
  };
  workflowTriggered?: { name: string; actions: string[]; triggeredAt: string };
  caseAllocation?: { matched: boolean; method: string; caseRef?: string; confidence: number };
}

export interface WorkflowRule {
  id: string;
  name: string;
  docType: string;
  triggerCondition: string;
  actions: Array<{ step: number; action: string; target: string }>;
  lastTriggered: string;
  triggeredThisMonth: number;
  active: boolean;
}

export interface DailyStats {
  date: string;
  received: number;
  processed: number;
  autoRouted: number;
  humanReview: number;
  avgProcessingMs: number;
  ocrConfidenceAvg: number;
}
