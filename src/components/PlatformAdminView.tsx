import React, { useCallback, useEffect, useState } from 'react';
import { Crown, KeyRound, RefreshCcw, Save, Search, Shield, Users } from 'lucide-react';
import {
  PlatformAccess, PlatformCampaignMember, PlatformPermission, PlatformRole,
  PlatformUser, platformAdminService
} from '../services/admin/platformAdminService';

interface Props { access: PlatformAccess; }

const availablePermissions: { key: PlatformPermission; label: string; detail: string }[] = [
  { key: 'users.view', label: 'Consultar usuários', detail: 'Ler diretório de contas da plataforma.' },
  { key: 'campaign_roles.manage', label: 'Gerenciar papéis de campanhas', detail: 'Alterar Mestre, Jogador e Observador em campanhas existentes.' }
];

const roleLabels: Record<PlatformRole,string> = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  moderador: 'Moderador',
  usuario: 'Usuário'
};

export const PlatformAdminView: React.FC<Props> = ({ access }) => {
  const root = access.role === 'super_admin';
  const canUsers = root || access.permissions.includes('users.view');
  const canCampaigns = root || access.permissions.includes('campaign_roles.manage');
  const [section, setSection] = useState<'users' | 'campaigns'>(canUsers ? 'users' : 'campaigns');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [members, setMembers] = useState<PlatformCampaignMember[]>([]);
  const [edit, setEdit] = useState<PlatformUser | null>(null);
  const [draftRole, setDraftRole] = useState<Exclude<PlatformRole,'super_admin'>>('usuario');
  const [draftPermissions, setDraftPermissions] = useState<PlatformPermission[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    setError('');
    try {
      if (canUsers && section === 'users') setUsers(await platformAdminService.listUsers(search.trim()));
      if (canCampaigns && section === 'campaigns') setMembers(await platformAdminService.listCampaignMembers(search.trim()));
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível carregar as permissões.'); }
  }, [canUsers,canCampaigns,search,section]);

  useEffect(() => { void refresh(); }, [refresh]);

  const startEdit = (user: PlatformUser) => {
    if (!root || user.global_role === 'super_admin') return;
    setEdit(user);
    setDraftRole(user.global_role as Exclude<PlatformRole,'super_admin'>);
    setDraftPermissions(user.permissions || []);
    setError(''); setNotice('');
  };
  const saveAccess = async () => {
    if (!edit || !root || busy) return;
    if (!window.confirm(`Atualizar cargo e permissões de ${edit.email}?`)) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await platformAdminService.setAccess(edit.user_id, draftRole, draftRole === 'usuario' ? [] : draftPermissions);
      setEdit(null);
      setNotice('Permissões atualizadas com sucesso. A próxima solicitação já usará os novos privilégios.');
      await refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível salvar o cargo.'); }
    finally { setBusy(false); }
  };

  const changeCampaignRole = async (member: PlatformCampaignMember, role: PlatformCampaignMember['member_role']) => {
    if (role === member.member_role || busy) return;
    if (!window.confirm(`Alterar ${member.member_email} de ${member.member_role} para ${role} na campanha "${member.campaign_name}"?`)) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await platformAdminService.setCampaignRole(member.campaign_id, member.member_user_id, role);
      setNotice('Papel da campanha atualizado. O membro pode precisar reabrir a campanha para ver o novo acesso.');
      await refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível atualizar o papel.'); }
    finally { setBusy(false); }
  };

  if (!canUsers && !canCampaigns) return (
    <div className="platform-admin"><p role="alert">Seu perfil não possui acesso ao painel administrativo.</p></div>
  );

  return (
    <section className="platform-admin">
      <header className="platform-admin__hero">
        <div className="platform-admin__eyebrow"><Shield size={16}/> Administração da plataforma</div>
        <h1>Central de Permissões</h1>
        <p>Controle cargos globais e papéis de campanha sem misturar as autorizações dos dois ambientes.</p>
        <div className="platform-admin__identity"><Crown size={16}/> Seu nível: <strong>{roleLabels[access.role]}</strong></div>
      </header>
      <div className="platform-admin__toolbar">
        {canUsers && <button className={section === 'users' ? 'is-active' : ''} onClick={() => { setSection('users'); setSearch(''); setEdit(null); }}>
          <Users size={15}/> Contas da plataforma
        </button>}
        {canCampaigns && <button className={section === 'campaigns' ? 'is-active' : ''} onClick={() => { setSection('campaigns'); setSearch(''); setEdit(null); }}>
          <KeyRound size={15}/> Papéis nas campanhas
        </button>}
      </div>
      <div className="platform-admin__filters">
        <Search size={16}/>
        <input type="search" aria-label="Buscar usuários ou campanhas" value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder={section === 'users' ? 'Buscar por nome ou e-mail' : 'Buscar campanha ou e-mail'} />
        <button type="button" onClick={() => void refresh()} title="Atualizar lista"><RefreshCcw size={16}/></button>
      </div>
      {error && <p className="platform-admin__message is-error" role="alert">{error}</p>}
      {notice && <p className="platform-admin__message" role="status">{notice}</p>}
      <div className="platform-admin__list">
        {section === 'users' && canUsers && users.map(user => (
          <article className="platform-admin__item" key={user.user_id}>
            <div>
              <strong>{user.display_name}</strong><span>{user.email}</span>
              <small>{roleLabels[user.global_role]} · {user.permissions.length} permissões delegadas</small>
            </div>
            {root && user.global_role !== 'super_admin'
              ? <button type="button" className="ro-button" onClick={() => startEdit(user)}>Gerenciar permissões</button>
              : <span className="platform-admin__readonly">{user.global_role === 'super_admin' ? 'Conta raiz protegida' : 'Somente leitura'}</span>}
          </article>
        ))}
        {section === 'campaigns' && canCampaigns && members.map(member => (
          <article className="platform-admin__item" key={`${member.campaign_id}:${member.member_user_id}`}>
            <div><strong>{member.member_name}</strong><span>{member.member_email}</span>
              <small>{member.campaign_name} · {member.member_status}</small></div>
            <label className="platform-admin__role-select">Papel nesta campanha
              <select value={member.member_role} disabled={busy || member.member_status !== 'ativo'}
                onChange={event => void changeCampaignRole(member, event.target.value as PlatformCampaignMember['member_role'])}>
                <option value="mestre">Mestre</option><option value="jogador">Jogador</option><option value="observador">Observador</option>
              </select>
            </label>
          </article>
        ))}
        {section === 'users' && canUsers && users.length === 0 && <p>Nenhuma conta encontrada.</p>}
        {section === 'campaigns' && canCampaigns && members.length === 0 && <p>Nenhum membro de campanha encontrado.</p>}
      </div>
      {edit && root && (
        <div className="actor-editor__backdrop" onMouseDown={() => !busy && setEdit(null)}>
          <div className="platform-admin__modal" role="dialog" aria-modal="true" aria-label="Editar permissões" onMouseDown={event => event.stopPropagation()}>
            <p className="ro-eyebrow">Permissões globais</p>
            <h2>{edit.display_name}</h2>
            <p>{edit.email}</p>
            <label>Cargo na plataforma
              <select value={draftRole} disabled={busy}
                onChange={event => {
                  const role = event.target.value as Exclude<PlatformRole,'super_admin'>;
                  setDraftRole(role); if (role === 'usuario') setDraftPermissions([]);
                }}>
                <option value="usuario">Usuário</option>
                <option value="moderador">Moderador</option>
                <option value="admin">Administrador</option>
              </select>
            </label>
            <div className="platform-admin__permissions">
              {availablePermissions.map(permission => (
                <label key={permission.key}>
                  <input type="checkbox" disabled={busy || draftRole === 'usuario'}
                    checked={draftRole !== 'usuario' && draftPermissions.includes(permission.key)}
                    onChange={event => setDraftPermissions(current => event.target.checked
                      ? [...new Set([...current, permission.key])]
                      : current.filter(item => item !== permission.key))}/>
                  <span><strong>{permission.label}</strong><small>{permission.detail}</small></span>
                </label>
              ))}
            </div>
            <small>Super Admin não pode ser concedido nesta tela. Os privilégios são conferidos pelo banco.</small>
            <div className="platform-admin__modal-actions">
              <button type="button" disabled={busy} onClick={() => setEdit(null)}>Cancelar</button>
              <button type="button" disabled={busy} className="ro-button" onClick={() => void saveAccess()}><Save size={15}/>{busy ? 'Salvando…' : 'Salvar permissões'}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
