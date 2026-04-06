
CREATE TRIGGER trg_assign_random_driver
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.assign_random_driver();
