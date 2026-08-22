import type Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

// ─── Types ─────────────────────────────────────

export interface Recommendation {
  id: string;
  applicationId: string;
  product: string;
  confidence: string;
  confidencePct: number;
  reasoning: string[];
  factors: any;
  alternatives: any;
  engineVersion: string;
  generatedAt: string;
}

export interface CreateRecommendationInput {
  applicationId: string;
  product: string;
  confidence: string;
  confidencePct: number;
  reasoning: string[];
  factors: any;
  alternatives: any;
  engineVersion: string;
  generatedAt?: string;
}

// ─── Repository ────────────────────────────────

export class RecommendationRepository {
  constructor(private db: Database.Database) {}

  private mapRow(row: any): Recommendation {
    return {
      id: row.id,
      applicationId: row.application_id,
      product: row.product,
      confidence: row.confidence,
      confidencePct: row.confidence_pct,
      reasoning: JSON.parse(row.reasoning),
      factors: JSON.parse(row.factors),
      alternatives: JSON.parse(row.alternatives),
      engineVersion: row.engine_version,
      generatedAt: row.generated_at,
    };
  }

  create(input: CreateRecommendationInput): Recommendation {
    const id = randomUUID();
    const generatedAt = input.generatedAt || new Date().toISOString();

    // Remove existing recommendation for this application (one-to-one)
    this.db.prepare('DELETE FROM recommendations WHERE application_id = ?').run(input.applicationId);

    this.db.prepare(`
      INSERT INTO recommendations (id, application_id, product, confidence, confidence_pct, reasoning, factors, alternatives, engine_version, generated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.applicationId,
      input.product,
      input.confidence,
      input.confidencePct,
      JSON.stringify(input.reasoning),
      JSON.stringify(input.factors),
      JSON.stringify(input.alternatives),
      input.engineVersion,
      generatedAt
    );

    return {
      id,
      applicationId: input.applicationId,
      product: input.product,
      confidence: input.confidence,
      confidencePct: input.confidencePct,
      reasoning: input.reasoning,
      factors: input.factors,
      alternatives: input.alternatives,
      engineVersion: input.engineVersion,
      generatedAt,
    };
  }

  findByApplication(applicationId: string): Recommendation | null {
    const row = this.db.prepare(
      'SELECT * FROM recommendations WHERE application_id = ?'
    ).get(applicationId) as any;
    return row ? this.mapRow(row) : null;
  }

  findById(id: string): Recommendation | null {
    const row = this.db.prepare('SELECT * FROM recommendations WHERE id = ?').get(id) as any;
    return row ? this.mapRow(row) : null;
  }

  deleteByApplication(applicationId: string): void {
    this.db.prepare('DELETE FROM recommendations WHERE application_id = ?').run(applicationId);
  }
}
