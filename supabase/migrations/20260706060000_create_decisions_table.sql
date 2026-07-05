-- Create decisions table for Decision Domain MVP
CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('Draft', 'Pending', 'Decided', 'Cancelled')),
  requested_by TEXT NOT NULL,
  decision_maker TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ,
  work_item_id UUID,
  initiative_id UUID,
  context_id UUID
);

-- Enable RLS (Row Level Security)
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;

-- Basic policy (adjust later as needed)
CREATE POLICY "Allow all for authenticated users" ON decisions
  FOR ALL USING (auth.role() = 'authenticated');
