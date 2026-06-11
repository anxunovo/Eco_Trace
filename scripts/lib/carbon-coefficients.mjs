import { CARBON_COEFFICIENTS } from '../../new-site/public/assets/carbon-coefficients.js';

export const DB_CARBON_COEFFICIENTS = CARBON_COEFFICIENTS.map(c => ({
  category: c.category,
  subcategory: c.subcategory,
  mode: c.mode,
  factor: c.factor,
  substitution_rate: c.substitutionRate,
  default_weight_kg: c.defaultWeightKg,
  source: c.source,
  source_ref: c.sourceRef,
  source_version: c.sourceVersion,
  note: c.note,
}));

export function carbonCoefficientDeactivateStatement(c) {
  return {
    sql: `UPDATE carbon_coefficients
      SET effective_to = datetime('now')
      WHERE category = ?
        AND subcategory IS ?
        AND source <> 'custom'
        AND effective_to IS NULL
        AND (
          source <> ?
          OR source_version IS NOT ?
          OR mode <> ?
          OR factor <> ?
          OR substitution_rate <> ?
          OR COALESCE(default_weight_kg, -1) <> COALESCE(?, -1)
          OR COALESCE(source_ref, '') <> COALESCE(?, '')
          OR note <> ?
        )`,
    args: [
      c.category,
      c.subcategory,
      c.source,
      c.source_version,
      c.mode,
      c.factor,
      c.substitution_rate,
      c.default_weight_kg,
      c.source_ref,
      c.note,
    ],
  };
}

export function carbonCoefficientEnsureStatement(c) {
  return {
    sql: `INSERT INTO carbon_coefficients (
      category, subcategory, mode, factor, substitution_rate, default_weight_kg,
      source, source_ref, source_version, note
    )
    SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    WHERE NOT EXISTS (
      SELECT 1 FROM carbon_coefficients
      WHERE category = ?
        AND subcategory IS ?
        AND source = ?
        AND effective_to IS NULL
        AND source_version IS ?
        AND mode = ?
        AND factor = ?
        AND substitution_rate = ?
        AND COALESCE(default_weight_kg, -1) = COALESCE(?, -1)
        AND COALESCE(source_ref, '') = COALESCE(?, '')
        AND note = ?
    )`,
    args: [
      c.category,
      c.subcategory,
      c.mode,
      c.factor,
      c.substitution_rate,
      c.default_weight_kg,
      c.source,
      c.source_ref,
      c.source_version,
      c.note,
      c.category,
      c.subcategory,
      c.source,
      c.source_version,
      c.mode,
      c.factor,
      c.substitution_rate,
      c.default_weight_kg,
      c.source_ref,
      c.note,
    ],
  };
}

export function carbonCoefficientDeduplicateStatement(c) {
  const matchArgs = [
    c.category,
    c.subcategory,
    c.source,
    c.source_version,
    c.mode,
    c.factor,
    c.substitution_rate,
    c.default_weight_kg,
    c.source_ref,
    c.note,
  ];

  return {
    sql: `UPDATE carbon_coefficients
      SET effective_to = datetime('now')
      WHERE id IN (
        SELECT id FROM carbon_coefficients
        WHERE category = ?
          AND subcategory IS ?
          AND source = ?
          AND effective_to IS NULL
          AND source_version IS ?
          AND mode = ?
          AND factor = ?
          AND substitution_rate = ?
          AND COALESCE(default_weight_kg, -1) = COALESCE(?, -1)
          AND COALESCE(source_ref, '') = COALESCE(?, '')
          AND note = ?
          AND id NOT IN (
            SELECT id FROM carbon_coefficients
            WHERE category = ?
              AND subcategory IS ?
              AND source = ?
              AND effective_to IS NULL
              AND source_version IS ?
              AND mode = ?
              AND factor = ?
              AND substitution_rate = ?
              AND COALESCE(default_weight_kg, -1) = COALESCE(?, -1)
              AND COALESCE(source_ref, '') = COALESCE(?, '')
              AND note = ?
            ORDER BY effective_from DESC, id DESC
            LIMIT 1
          )
      )`,
    args: [...matchArgs, ...matchArgs],
  };
}

export function carbonCoefficientSyncStatements(c) {
  return [
    carbonCoefficientDeactivateStatement(c),
    carbonCoefficientEnsureStatement(c),
    carbonCoefficientDeduplicateStatement(c),
  ];
}
