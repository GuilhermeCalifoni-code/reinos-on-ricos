import m001 from '../../supabase/migrations/001_auth_profiles.sql?raw';
import m002 from '../../supabase/migrations/002_campaigns.sql?raw';
import m003 from '../../supabase/migrations/003_characters_campaign_links.sql?raw';
import m004 from '../../supabase/migrations/004_rls_foundation.sql?raw';
import m005 from '../../supabase/migrations/005_fix_invite_code_function.sql?raw';
import m006 from '../../supabase/migrations/006_session_events.sql?raw';
import m007 from '../../supabase/migrations/007_reload_postgrest_schema_cache.sql?raw';
import m008 from '../../supabase/migrations/008_live_table_realtime.sql?raw';
import m009 from '../../supabase/migrations/009_campaign_content_and_storage.sql?raw';
import m010 from '../../supabase/migrations/010_actor_sheets.sql?raw';

/**
 * Setup completo exibido pela interface.
 * A ordem é a mesma das migrations versionadas e pode ser executada em um projeto Supabase novo.
 */
export const SUPABASE_SQL_QUERY = [
  m001, m002, m003, m004, m005, m006, m007, m008, m009, m010
].join('\n\n-- =============================================\n\n');
