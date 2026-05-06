
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tip numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS restaurant_rating int,
  ADD COLUMN IF NOT EXISTS driver_rating int,
  ADD COLUMN IF NOT EXISTS rating_comment text,
  ADD COLUMN IF NOT EXISTS rated_at timestamptz;

ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.order_items REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Allow customers to update their own order's rating/tip
DROP POLICY IF EXISTS "Customers can rate their orders" ON public.orders;
CREATE POLICY "Customers can rate their orders"
  ON public.orders FOR UPDATE
  USING (
    customer_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = orders.customer_id AND p.user_id = auth.uid())
  )
  WITH CHECK (true);
