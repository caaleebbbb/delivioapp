
-- Add columns for DoorDash-style driver offer system
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS offered_to_driver_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS offer_expires_at timestamp with time zone;

-- Add driver availability to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_available boolean NOT NULL DEFAULT false;

-- Create a function to assign a random available driver when order becomes ready
CREATE OR REPLACE FUNCTION public.assign_random_driver()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _driver_id uuid;
BEGIN
  -- Only fire when status changes to 'ready'
  IF NEW.status = 'ready' AND (OLD.status IS DISTINCT FROM 'ready') THEN
    SELECT id INTO _driver_id
    FROM public.profiles
    WHERE role = 'driver' AND is_available = true
    ORDER BY random()
    LIMIT 1;
    
    IF _driver_id IS NOT NULL THEN
      NEW.offered_to_driver_id := _driver_id;
      NEW.offer_expires_at := now() + interval '20 seconds';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS trg_assign_driver ON public.orders;
CREATE TRIGGER trg_assign_driver
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.assign_random_driver();

-- Update RLS: drivers can update orders offered to them
DROP POLICY IF EXISTS "Drivers can update orders they claim" ON public.orders;
CREATE POLICY "Drivers can update orders they claim"
ON public.orders FOR UPDATE TO public
USING (
  (status IN ('ready', 'out-for-delivery'))
  AND (
    offered_to_driver_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = orders.offered_to_driver_id AND profiles.user_id = auth.uid()
    )
    OR
    driver_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = orders.driver_id AND profiles.user_id = auth.uid()
    )
  )
);

-- Allow drivers to update their own profile (is_available toggle)
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
