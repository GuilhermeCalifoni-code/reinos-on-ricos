import { useEffect, useState } from 'react';
import { PlatformAccess, platformAdminService } from './platformAdminService';

const ordinary: PlatformAccess = { role: 'usuario', permissions: [] };

export function usePlatformAccess(userId?: string) {
  const [access, setAccess] = useState<PlatformAccess>(ordinary);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let active = true;
    setAccess(ordinary);
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    void platformAdminService.getAccess()
      .then(data => { if (active) setAccess(data); })
      .catch(() => { if (active) setAccess(ordinary); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId]);
  const superAdmin = access.role === 'super_admin';
  const canViewUsers = superAdmin || access.permissions.includes('users.view');
  const canManageCampaignRoles = superAdmin || access.permissions.includes('campaign_roles.manage');
  const canManageCommunity = superAdmin || access.permissions.includes('community.members.manage');
  const canModerateCommunity = superAdmin || access.permissions.includes('community.posts.moderate');
  return { ...access, superAdmin, canViewUsers, canManageCampaignRoles, canManageCommunity, canModerateCommunity, loading };
}
