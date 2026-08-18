import { pgTable, serial, text, integer, date, timestamp } from "drizzle-orm/pg-core";

/**
 * MVP DEMO SCHEMA — INTENTIONALLY SIMPLIFIED
 * ---------------------------------------------------------------
 * This is a single flat table so we can prove the pipeline end-to-end
 * (CSV -> Supabase -> simple processing -> display) as fast as possible.
 *
 * This is NOT the production schema. The real product design keeps
 * identity data (name, DOB) and response data in separate stores linked
 * only by a disposable token, with row-level security enforcing tenant
 * isolation. Because Task 0's test CSV is 100% fictional data, it's safe
 * to keep it flat for this demo. Do not point this schema at real patient
 * data — see README "Before this touches real data" section.
 */
export const surveyResponses = pgTable("survey_responses", {
  id: serial("id").primaryKey(),
  patientName: text("patient_name").notNull(),
  admissionDate: date("admission_date").notNull(),
  dischargeDate: date("discharge_date").notNull(),
  ward: text("ward").notNull(),
  age: integer("age").notNull(),
  contactPreference: text("contact_preference").notNull(),
  npsScore: integer("nps_score").notNull(), // 0-10, simulates the survey response
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type NewSurveyResponse = typeof surveyResponses.$inferInsert;
