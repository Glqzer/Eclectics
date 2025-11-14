-- Add choreography name column
ALTER TABLE choreographies ADD COLUMN IF NOT EXISTS name varchar(255) NOT NULL DEFAULT '';
