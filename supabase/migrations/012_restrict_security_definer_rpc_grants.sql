-- Reinos Oníricos
-- Remove implicit PUBLIC execute from SECURITY DEFINER helpers.
-- Authenticated users retain the functions required by RLS and explicit RPC flows.

revoke execute on function public.can_read_campaign_content(uuid,text) from public;
revoke execute on function public.can_read_live_content(uuid,text) from public;
revoke execute on function public.can_read_map_token(uuid,uuid,boolean) from public;
revoke execute on function public.can_read_session_event(uuid,text,uuid) from public;
revoke execute on function public.can_update_own_linked_character(uuid,text) from public;
revoke execute on function public.create_campaign(text,text,text,text) from public;
revoke execute on function public.is_active_campaign_member(uuid,uuid) from public;
revoke execute on function public.is_campaign_master(uuid) from public;
revoke execute on function public.is_campaign_master_user(uuid,uuid) from public;
revoke execute on function public.is_campaign_member(uuid) from public;
revoke execute on function public.is_campaign_player(uuid) from public;
revoke execute on function public.join_campaign_by_code(text) from public;
revoke execute on function public.link_own_character_to_membership(uuid,text) from public;
revoke execute on function public.regenerate_campaign_invite(uuid) from public;

grant execute on function public.can_read_campaign_content(uuid,text) to authenticated;
grant execute on function public.can_read_live_content(uuid,text) to authenticated;
grant execute on function public.can_read_map_token(uuid,uuid,boolean) to authenticated;
grant execute on function public.can_read_session_event(uuid,text,uuid) to authenticated;
grant execute on function public.can_update_own_linked_character(uuid,text) to authenticated;
grant execute on function public.create_campaign(text,text,text,text) to authenticated;
grant execute on function public.is_active_campaign_member(uuid,uuid) to authenticated;
grant execute on function public.is_campaign_master(uuid) to authenticated;
grant execute on function public.is_campaign_master_user(uuid,uuid) to authenticated;
grant execute on function public.is_campaign_member(uuid) to authenticated;
grant execute on function public.is_campaign_player(uuid) to authenticated;
grant execute on function public.join_campaign_by_code(text) to authenticated;
grant execute on function public.link_own_character_to_membership(uuid,text) to authenticated;
grant execute on function public.regenerate_campaign_invite(uuid) to authenticated;
