
-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Drivers can update orders they claim" ON public.orders;

-- Recreate with proper USING (matches current row) and WITH CHECK (allows new status)
CREATE POLICY "Drivers can update orders they claim"
ON public.orders
FOR UPDATE
USING (
  status = ANY (ARRAY['ready', 'out-for-delivery']) 
  AND (
    (offered_to_driver_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = orders.offered_to_driver_id AND profiles.user_id = auth.uid()
    ))
    OR
    (driver_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = orders.driver_id AND profiles.user_id = auth.uid()
    ))
  )
)
WITH CHECK (true);
