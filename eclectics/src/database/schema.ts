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
  createdAt: timestamp('created_at').defaultNow().notNull()
});

