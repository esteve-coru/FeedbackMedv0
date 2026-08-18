CREATE TABLE IF NOT EXISTS "survey_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_name" text NOT NULL,
	"admission_date" date NOT NULL,
	"discharge_date" date NOT NULL,
	"ward" text NOT NULL,
	"age" integer NOT NULL,
	"contact_preference" text NOT NULL,
	"nps_score" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
