
-- Allow anonymous (unauthenticated) users to place orders
CREATE POLICY "Anyone can place orders" ON public.orders FOR INSERT WITH CHECK (true);

-- Allow anyone to insert order items  
CREATE POLICY "Anyone can insert order items" ON public.order_items FOR INSERT WITH CHECK (true);

-- Allow anyone to view orders (for guest order tracking)
CREATE POLICY "Anyone can view all orders" ON public.orders FOR SELECT USING (true);

-- Allow anyone to view order items
CREATE POLICY "Anyone can view all order items" ON public.order_items FOR SELECT USING (true);

-- Drop the old restrictive policies that required auth
DROP POLICY IF EXISTS "Customers can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Restaurants can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Drivers can view ready and their orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can place orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Order items visible to order viewers" ON public.order_items;

-- Make customer_id nullable for guest orders
ALTER TABLE public.orders ALTER COLUMN customer_id DROP NOT NULL;
