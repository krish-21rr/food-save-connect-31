REVOKE EXECUTE ON FUNCTION public.fulfill_request(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.cancel_request(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_pickup_code(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.confirm_pickup_with_code(uuid, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.fulfill_request(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pickup_code(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_pickup_with_code(uuid, text) TO authenticated;