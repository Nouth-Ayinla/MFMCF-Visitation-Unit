-- Add last_sms_sent_at column to members table for tracking SMS history
ALTER TABLE public.members 
ADD COLUMN last_sms_sent_at timestamp with time zone;

-- Add index for better query performance
CREATE INDEX idx_members_last_sms_sent_at ON public.members(last_sms_sent_at);

-- Add comment for documentation
COMMENT ON COLUMN public.members.last_sms_sent_at IS 'Timestamp of when the last SMS was sent to this member';