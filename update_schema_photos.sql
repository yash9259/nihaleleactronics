-- Add device_photo_url column to repairs table
ALTER TABLE repairs 
ADD COLUMN device_photo_url text;

-- (Optional) If you haven't created the bucket yet via Dashboard, 
-- you can try running this, but Dashboard is recommended for public setting.
-- insert into storage.buckets (id, name, public) values ('damaged-devices', 'damaged-devices', true);
