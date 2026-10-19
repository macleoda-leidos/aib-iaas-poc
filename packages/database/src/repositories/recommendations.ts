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
  // Caseworker override (Phase 4). Null until a human overrides the engine's
  // product; when set, `product` above still carries the ENGINE's output so both
  // are visible, and `overrideProduct` is the human decision.
  overrideProduct: string | null;
  overrideJustification: string | null;
  overrideBy: string | null;
  overrideByName: string | null;
  overriddenAt: string | null;
}

export interface ApplyOverrideInput {
  product: string;
  justification: string;
  overrideBy: string;
  overrideByName: string;
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
      overrideProduct: row.override_product ?? null,
      overrideJustification: row.override_justification ?? null,
      overrideBy: row.override_by ?? null,
      overrideByName: row.override_by_name ?? null,
      overriddenAt: row.overridden_at ?? null,
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
      overrideProduct: null,
      overrideJustification: null,
      overrideBy: null,
      overrideByName: null,
      overriddenAt: null,
    };
  }

  /**
   * Record a caseworker override of the engine's recommendation (Phase 4). The
   * engine's original output (product/confidence/factors/reasoning) is left
   * untouched; only the override_* columns are set, so the case screen shows both
   * the engine's answer and the human decision. Returns the updated row, or null
   * if no recommendation exists for the application. The justification is required
   * by the caller (the route rejects an empty one) — this layer stores whatever it
   * is given.
   */
  applyOverride(applicationId: string, input: ApplyOverrideInput): Recommendation | null {
    const result = this.db.prepare(`
      UPDATE recommendations
         SET override_product = ?, override_justification = ?, override_by = ?, override_by_name = ?, overridden_at = ?
       WHERE application_id = ?
    `).run(input.product, input.justification, input.overrideBy, input.overrideByName, new Date().toISOString(), applicationId);

    if (result.changes === 0) return null;
    return this.findByApplication(applicationId);
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
