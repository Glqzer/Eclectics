import { pgTable, serial, timestamp, varchar, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 120 }),
  passwordHash: varchar('password_hash', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull()
});


export const choreographies = pgTable('choreographies', {
  id: serial('id').primaryKey(),
  choreographerUserId: integer('choreographer_user_id').notNull().references(() => users.id),
  name: varchar('name', { length: 255 }).notNull().default(''),
  cut: varchar('cut', { length: 512 }),
  cleaningVideos: varchar('cleaning_videos', { length: 512 }),
  cleaningNotes: varchar('cleaning_notes', { length: 512 }),
  blockingSlides: varchar('blocking_slides', { length: 512 }),
  createdAt: timestamp('created_at').defaultNow().notNull()
});


export const schedules = pgTable('schedules', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD
  // Deprecated single time; kept for backward compatibility. New start/end times below.
  time: varchar('time', { length: 8 }), // legacy
  startTime: varchar('start_time', { length: 8 }).notNull(), // HH:MM 24h or HH:MM AM/PM
  endTime: varchar('end_time', { length: 8 }).notNull(), // HH:MM 24h or HH:MM AM/PM
  type: varchar('type', { length: 50 }).notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  description: varchar('description', { length: 1024 }),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

