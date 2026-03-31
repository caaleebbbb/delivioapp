
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'restaurant', 'customer', 'driver');

-- Profiles table (created on signup)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role app_role NOT NULL,
  full_name TEXT,
  business_name TEXT,
  vehicle TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- User roles table for admin privileges
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Admin can see all roles
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Menu items table
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available menu items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Restaurant owners can insert menu items" ON public.menu_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = restaurant_id AND user_id = auth.uid() AND role = 'restaurant')
);
CREATE POLICY "Restaurant owners can update their menu items" ON public.menu_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = restaurant_id AND user_id = auth.uid() AND role = 'restaurant')
);
CREATE POLICY "Restaurant owners can delete their menu items" ON public.menu_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = restaurant_id AND user_id = auth.uid() AND role = 'restaurant')
);

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.profiles(id) NOT NULL,
  customer_name TEXT NOT NULL,
  restaurant_id UUID REFERENCES public.profiles(id) NOT NULL,
  restaurant_name TEXT NOT NULL,
  driver_id UUID REFERENCES public.profiles(id),
  driver_name TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'placed' CHECK (status IN ('placed', 'preparing', 'ready', 'out-for-delivery', 'delivered')),
  address TEXT NOT NULL,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their orders" ON public.orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = customer_id AND user_id = auth.uid())
);
CREATE POLICY "Restaurants can view their orders" ON public.orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = restaurant_id AND user_id = auth.uid())
);
CREATE POLICY "Drivers can view ready and their orders" ON public.orders FOR SELECT USING (
  status = 'ready' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = driver_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Customers can place orders" ON public.orders FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = customer_id AND user_id = auth.uid() AND role = 'customer')
);
CREATE POLICY "Restaurants can update their orders" ON public.orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = restaurant_id AND user_id = auth.uid())
);
CREATE POLICY "Drivers can update orders they claim" ON public.orders FOR UPDATE USING (
  status IN ('ready', 'out-for-delivery') AND (
    driver_id IS NULL OR EXISTS (SELECT 1 FROM public.profiles WHERE id = driver_id AND user_id = auth.uid())
  )
);

-- Order items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  menu_item_id UUID REFERENCES public.menu_items(id),
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  line_total NUMERIC(10,2) NOT NULL
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order items visible to order viewers" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_id AND (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = orders.customer_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = orders.restaurant_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = orders.driver_id AND user_id = auth.uid()) OR
    public.has_role(auth.uid(), 'admin')
  ))
);
CREATE POLICY "Customers can insert order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = orders.customer_id AND user_id = auth.uid())
  )
);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role, full_name, business_name, vehicle)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data ->> 'role')::app_role,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'business_name',
    NEW.raw_user_meta_data ->> 'vehicle'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
