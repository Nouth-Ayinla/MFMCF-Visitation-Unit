-- Change date_of_birth column from date to text in members table
-- First convert existing data to MM-DD format
ALTER TABLE public.members 
ALTER COLUMN date_of_birth TYPE text 
USING to_char(date_of_birth, 'MM-DD');

-- Change date_of_birth column from date to text in registrations table
ALTER TABLE public.registrations 
ALTER COLUMN date_of_birth TYPE text 
USING to_char(date_of_birth, 'MM-DD');