import { config } from "dotenv";
config({ path: ".env.local" });
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { db } from "../lib/db";
import { surveyResponses, type NewSurveyResponse } from "../lib/db/schema";

// Pass a path as an argument, e.g. `npm run import:csv -- ./sample-data/test-patients.csv`
// Defaults to the bundled test file if nothing is passed.
const filePath = process.argv[2] ?? path.join(process.cwd(), "sample-data/test-patients.csv");

type CsvRow = {
  patient_name: string;
  admission_date: string;
  discharge_date: string;
  ward: string;
  age: string;
  contact_preference: string;
  nps_score: string;
};

async function main() {
  console.log(`Reading ${filePath} ...`);
  const raw = fs.readFileSync(filePath, "utf-8");

  const rows: CsvRow[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`Parsed ${rows.length} rows. Validating...`);

  const records: NewSurveyResponse[] = [];
  const errors: string[] = [];

  rows.forEach((row, i) => {
    const lineNo = i + 2; // +1 for header, +1 for 1-indexing
    const age = Number(row.age);
    const npsScore = Number(row.nps_score);

    if (!row.patient_name) errors.push(`Line ${lineNo}: missing patient_name`);
    if (!row.admission_date) errors.push(`Line ${lineNo}: missing admission_date`);
    if (!row.discharge_date) errors.push(`Line ${lineNo}: missing discharge_date`);
    if (!row.ward) errors.push(`Line ${lineNo}: missing ward`);
    if (Number.isNaN(age)) errors.push(`Line ${lineNo}: invalid age "${row.age}"`);
    if (Number.isNaN(npsScore) || npsScore < 0 || npsScore > 10)
      errors.push(`Line ${lineNo}: invalid nps_score "${row.nps_score}" (must be 0-10)`);

    const rowErrors = errors.filter((e) => e.startsWith(`Line ${lineNo}:`));
    if (rowErrors.length === 0) {
      records.push({
        patientName: row.patient_name,
        admissionDate: row.admission_date,
        dischargeDate: row.discharge_date,
        ward: row.ward,
        age,
        contactPreference: row.contact_preference || "none",
        npsScore,
      });
    }
  });

  if (errors.length > 0) {
    console.warn(`\n${errors.length} row(s) skipped due to validation errors:`);
    errors.forEach((e) => console.warn(`  - ${e}`));
    console.warn("");
  }

  if (records.length === 0) {
    console.log("No valid rows to import. Exiting.");
    return;
  }

  console.log(`Inserting ${records.length} valid rows into Supabase...`);
  await db.insert(surveyResponses).values(records);

  console.log(`Done. Imported ${records.length} rows (${errors.length} skipped).`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
