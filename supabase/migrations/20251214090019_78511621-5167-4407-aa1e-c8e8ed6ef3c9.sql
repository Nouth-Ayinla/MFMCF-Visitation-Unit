-- Create an enum for service types
CREATE TYPE public.service_type AS ENUM ('bible_study', 'revival_hour', 'sunday_service');

-- Add service_type column to attendance table
ALTER TABLE public.attendance 
ADD COLUMN service_type public.service_type NOT NULL DEFAULT 'sunday_service';