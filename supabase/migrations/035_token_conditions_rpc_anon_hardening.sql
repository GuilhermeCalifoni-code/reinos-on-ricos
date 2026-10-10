-- Supabase applies its default EXECUTE grants to anon as well as authenticated.
-- Remove anonymous access explicitly. The function itself still checks auth.uid()
-- and campaign-member ownership even when called by an authenticated client.
revoke all on function public.set_own_map_token_conditions(uuid,text[]) from anon;
