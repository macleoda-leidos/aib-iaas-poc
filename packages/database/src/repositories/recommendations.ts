import type { DbDriver } from '../driver';
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
  constructor(private driver: DbDriver) {}

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

  async create(input: CreateRecommendationInput): Promise<Recommendation> {
    const id = randomUUID();
    const generatedAt = input.generatedAt || new Date().toISOString();

    // Remove existing recommendation for this application (one-to-one)
    await this.driver.run('DELETE FROM recommendations WHERE application_id = ?', [input.applicationId]);

    await this.driver.run(`
      INSERT INTO recommendations (id, application_id, product, confidence, confidence_pct, reasoning, factors, alternatives, engine_version, generated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      input.applicationId,
      input.product,
      input.confidence,
      input.confidencePct,
      JSON.stringify(input.reasoning),
      JSON.stringify(input.factors),
      JSON.stringify(input.alternatives),
      input.engineVersion,
      generatedAt,
    ]);

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

  async findByApplication(applicationId: string): Promise<Recommendation | null> {
    const row = await this.driver.get(
      'SELECT * FROM recommendations WHERE application_id = ?',
      [applicationId]
    );
    return row ? this.mapRow(row) : null;
  }

  async findById(id: string): Promise<Recommendation | null> {
    const row = await this.driver.get('SELECT * FROM recommendations WHERE id = ?', [id]);
    return row ? this.mapRow(row) : null;
  }

  async deleteByApplication(applicationId: string): Promise<void> {
    await this.driver.run('DELETE FROM recommendations WHERE application_id = ?', [applicationId]);
  }
}
