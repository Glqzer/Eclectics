-- 0004_add_schedule_start_end.sql
ALTER TABLE schedules ADD COLUMN start_time varchar(8) NOT NULL DEFAULT '00:00';
ALTER TABLE schedules ADD COLUMN end_time varchar(8) NOT NULL DEFAULT '00:00';
-- make legacy time nullable
ALTER TABLE schedules ALTER COLUMN time DROP NOT NULL;
-- Optional backfill: set start_time = time where time not null; end_time = time where time not null (could adjust duration later)
UPDATE schedules SET start_time = time WHERE time IS NOT NULL;
UPDATE schedules SET end_time = time WHERE time IS NOT NULL;