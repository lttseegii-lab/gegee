-- Product image gallery for the hover slider
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS gallery_urls text[] DEFAULT '{}';
