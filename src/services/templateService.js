import { getDb } from '../dal/db.js';

function mapRow(row) {
  return {
    id: row.TemplateID,
    name: row.Name,
    diagnosisText: row.DiagnosisText,
    recommendationText: row.RecommendationText,
    active: !!row.IsActive
  };
}

export function listTemplates() {
  const db = getDb();
  return db.prepare('SELECT * FROM ResultTemplates ORDER BY TemplateID DESC').all().map(mapRow);
}

export function saveTemplate(payload) {
  const db = getDb();
  if (payload.id) {
    db.prepare(
      'UPDATE ResultTemplates SET Name=@Name, DiagnosisText=@DiagnosisText, RecommendationText=@RecommendationText, IsActive=@IsActive WHERE TemplateID=@TemplateID'
    ).run({
      TemplateID: payload.id,
      Name: payload.name,
      DiagnosisText: payload.diagnosisText,
      RecommendationText: payload.recommendationText,
      IsActive: payload.active ? 1 : 0
    });
    return mapRow(db.prepare('SELECT * FROM ResultTemplates WHERE TemplateID = ?').get(payload.id));
  }
  const info = db.prepare(
    'INSERT INTO ResultTemplates (Name, DiagnosisText, RecommendationText, IsActive) VALUES (@Name, @DiagnosisText, @RecommendationText, @IsActive)'
  ).run({
    Name: payload.name,
    DiagnosisText: payload.diagnosisText,
    RecommendationText: payload.recommendationText,
    IsActive: payload.active ? 1 : 0
  });
  return mapRow(db.prepare('SELECT * FROM ResultTemplates WHERE TemplateID = ?').get(info.lastInsertRowid));
}

export function deleteTemplate(id) {
  const db = getDb();
  db.prepare('DELETE FROM ResultTemplates WHERE TemplateID = ?').run(id);
  return true;
}
