-- Add Zillow-style columns to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS year_built integer,
ADD COLUMN IF NOT EXISTS lot_size_sqft integer,
ADD COLUMN IF NOT EXISTS property_subtype text,
ADD COLUMN IF NOT EXISTS garage_spaces integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS heating_type text,
ADD COLUMN IF NOT EXISTS cooling_type text,
ADD COLUMN IF NOT EXISTS hoa_fee_cents integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS pet_policy text,
ADD COLUMN IF NOT EXISTS deposit_cents integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS available_date date,
ADD COLUMN IF NOT EXISTS virtual_tour_url text;