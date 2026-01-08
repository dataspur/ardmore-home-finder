-- Create properties table with location data
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  property_type TEXT NOT NULL CHECK (property_type IN ('rental', 'sale')),
  price_cents INTEGER NOT NULL,
  price_display TEXT NOT NULL,
  size_sqft INTEGER,
  bedrooms INTEGER,
  bathrooms NUMERIC(3,1),
  address TEXT NOT NULL,
  city TEXT DEFAULT 'Ardmore',
  state TEXT DEFAULT 'OK',
  zip_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  image_url TEXT,
  badge TEXT DEFAULT 'Available',
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Public read access for active properties
CREATE POLICY "Anyone can view active properties"
ON public.properties FOR SELECT
USING (is_active = true);

-- Admins can manage all properties
CREATE POLICY "Admins can manage properties"
ON public.properties FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial property data with Ardmore, OK coordinates
INSERT INTO public.properties (title, property_type, price_cents, price_display, size_sqft, bedrooms, bathrooms, address, latitude, longitude, badge, is_featured) VALUES
('3 Bed / 2 Bath – Maple St.', 'rental', 120000, '$1,200/mo', 1450, 3, 2, '123 Maple St, Ardmore, OK', 34.1743, -97.1436, 'Available', false),
('2 Bed / 1 Bath – 7th Ave.', 'rental', 92500, '$925/mo', 980, 2, 1, '456 7th Ave, Ardmore, OK', 34.1785, -97.1389, 'Featured', true),
('4 Bed / 3 Bath – Cedar Dr.', 'rental', 160000, '$1,600/mo', 1900, 4, 3, '789 Cedar Dr, Ardmore, OK', 34.1698, -97.1512, 'Available', false),
('3 Bed / 2 Bath – Forest Ln.', 'sale', 21500000, '$215,000', 1700, 3, 2, '101 Forest Ln, Ardmore, OK', 34.1812, -97.1456, 'For Sale', false),
('2 Bed / 2 Bath – East Main', 'sale', 17900000, '$179,000', 1300, 2, 2, '202 East Main St, Ardmore, OK', 34.1756, -97.1345, 'Featured', true),
('4 Bed / 3 Bath – Willow Way', 'sale', 24900000, '$249,000', 2100, 4, 3, '303 Willow Way, Ardmore, OK', 34.1678, -97.1589, 'For Sale', false);