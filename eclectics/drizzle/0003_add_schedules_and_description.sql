-- Migration: add schedules table and description column to existing schedules if present
-- Creates table if it does not exist (id, title, date, time, type, location, description, created_at)
CREATE TABLE IF NOT EXISTS "schedules" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" varchar(255) NOT NULL,
  "date" varchar(10) NOT NULL,
  "time" varchar(8) NOT NULL,
  "type" varchar(50) NOT NULL,
  "location" varchar(255) NOT NULL,
  "description" varchar(1024),
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- If table existed earlier without description column, ensure column exists.
ALTER TABLE "schedules" ADD COLUMN IF NOT EXISTS "description" varchar(1024);