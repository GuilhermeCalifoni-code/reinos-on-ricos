import React, { useCallback, useEffect, useState } from 'react';
import { Check, Search, ShieldBan, ShieldCheck, X } from 'lucide-react';
import { communityService, CommunityPlan } from '../services/community/communityService';
import { CommunityAccount, CommunityModerationPost, platformAdminService } from '../services/admin/platformAdminService';

type Mode = 'access' | 'moderation';

export const CommunityAdminPanel: React.FC<{mode: Mode}> = ({mode}) => {
  const [email,setEmail]=useState('');
  const [account,setAccount]=useState<CommunityAccount|null>(null);
  const [plans,setPlans]=useState<CommunityPlan[]>([]);
  const [status,setStatus]=useState<CommunityAccount['access_status']>('allowed');
  const [manualPlan,setManualPlan]=useState('');
  const [filter,setFilter]=useState<'pending'|'approved'|'rejected'|'all'>('pending');
  const [posts,setPosts]=useState<CommunityModerationPost[]>([]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');

  const refreshPosts=useCallback(async () => {
    try { setPosts(await platformAdminService.listCommunityPosts(filter)); }
    catch(e) { setError(e instanceof Error ? e.message : 'Erro ao consultar publicações.'); }
  },[filter]);

  useEffect(()=>{
    if(mode==='access') {
      void communityService.listarPlanos().then(setPlans)
        .catch(e=>setError(e instanceof Error?e.message:'Não foi possível carregar os níveis.'));
    } else {
      void refreshPosts();
    }
  },[mode,refreshPosts]);

  const lookup=async (event:React.FormEvent) => {
    event.preventDefault();
    if(!email.trim())return;
    setBusy(true);setError('');setNotice('');setAccount(null);
    try {
      const found=await platformAdminService.lookupCommunityUser(email.trim());
      if(!found){setError('Nenhuma conta encontrada com este e-mail exato. A pessoa precisa se cadastrar primeiro.');return;}
      setAccount(found);setStatus(found.access_status);
      setManualPlan(found.manual_plan_slug||'');
    } catch(e) {setError(e instanceof Error?e.message:'Não foi possível buscar essa conta.');}
    finally {setBusy(false);}
  };
  const save=async () => {
    if(!account||busy||account.global_role==='super_admin')return;
    if(!window.confirm(`Confirmar acesso de ${account.email}: ${status==='blocked'?'bloqueado':'liberado'}, nível manual ${manualPlan||'nenhum'}?`))return;
    setBusy(true);setError('');setNotice('');
    try {
      await platformAdminService.setCommunityAccess(account.user_id,status,manualPlan||null);
      const fresh=await platformAdminService.lookupCommunityUser(account.email);
      setAccount(fresh);
      setNotice('Liberação da Comunidade atualizada no Supabase. A alteração foi registrada na auditoria.');
    } catch(e) {setError(e instanceof Error?e.message:'Erro ao salvar a liberação.');}
    finally {setBusy(false);}
  };
  const review=async (post:CommunityModerationPost,decision:'approved'|'rejected') => {
    if(busy)return;
    const note=decision==='rejected'?window.prompt('Motivo da rejeição (opcional, até 500 caracteres):',''): '';
    if(note===null)return;
    if(!window.confirm(`${decision==='approved'?'Aprovar':'Rejeitar'} a publicação "${post.title}" de ${post.author_email}?`))return;
    setBusy(true);setError('');setNotice('');
    try {
      await platformAdminService.reviewCommunityPost(post.post_id,decision,note||'');
      setNotice(decision==='approved'?'Publicação aprovada e visível aos membros.':'Publicação rejeitada.');
      await refreshPosts();
    }catch(e){setError(e instanceof Error?e.message:'Falha ao moderar publicação.');}
    finally{setBusy(false);}
  };

  return <div className="platform-admin__community">
    {mode==='access' ? <>
      <h2>Liberações por e-mail</h2>
      <p>Digite exatamente o e-mail usado no login. A busca consulta a conta real do Supabase Auth; nenhum privilégio é atribuído por nome ou apelido.</p>
      <form className="platform-admin__lookup" onSubmit={event=>void lookup(event)}>
        <input type="email" value={email} required maxLength={254}
          onChange={event=>setEmail(event.target.value)}
          placeholder="usuario@exemplo.com" aria-label="E-mail de login do usuário"/>
        <button type="submit" className="ro-button" disabled={busy}><Search size={16}/> Buscar conta</button>
      </form>
      {account && <article className="platform-admin__account">
        <div><strong>{account.display_name}</strong><span>{account.email}</span>
          <small>{account.email_confirmed?'E-mail verificado':'E-mail ainda não verificado'} · Cargo global: {account.global_role}</small></div>
        <div className="platform-admin__account-grid">
          <label>Situação na Comunidade
            <select value={status} disabled={busy||account.global_role==='super_admin'}
              onChange={event=>setStatus(event.target.value as CommunityAccount['access_status'])}>
              <option value="allowed">Liberado</option>
              <option value="blocked">Bloqueado na Comunidade</option>
            </select>
          </label>
          <label>Nível concedido manualmente
            <select value={manualPlan} disabled={busy||account.global_role==='super_admin'}
              onChange={event=>setManualPlan(event.target.value)}>
              <option value="">Nenhum (seguir plano normal)</option>
              {plans.filter(plan=>plan.rank>0).map(plan=><option key={plan.id} value={plan.slug}>{plan.nome}</option>)}
            </select>
          </label>
        </div>
        <p>Plano de assinatura: <strong>{account.paid_plan_slug||'Nenhum'}</strong> · Nível efetivo: <strong>{account.effective_rank}</strong></p>
        <small>Liberações manuais não geram cobranças nem alteram assinaturas. Bloquear a Comunidade não remove acesso às campanhas do RPG.</small>
        {account.global_role==='super_admin'
          ? <p>Conta raiz protegida: suas permissões não podem ser alteradas por este formulário.</p>
          : <button type="button" className="ro-button" disabled={busy} onClick={()=>void save()}>
              <ShieldCheck size={16}/> Salvar liberação
            </button>}
      </article>}
    </>:<>
      <div className="platform-admin__review-heading">
        <div><h2>Moderação de publicações</h2><p>Apenas publicações aprovadas aparecem no mural. Todo envio novo começa pendente.</p></div>
        <label>Mostrar <select value={filter}
          onChange={event=>setFilter(event.target.value as typeof filter)}>
          <option value="pending">Pendentes</option><option value="approved">Aprovadas</option>
          <option value="rejected">Rejeitadas</option><option value="all">Todas</option>
        </select></label>
      </div>
      {posts.length===0 && <p>Nenhuma publicação nesta categoria.</p>}
      {posts.map(post=><article className="platform-admin__review-card" key={post.post_id}>
        <div><strong>{post.title}</strong><small>{post.author_name} · {post.author_email}</small>
          <small>{new Date(post.created_at).toLocaleString('pt-BR')} · {post.status}</small></div>
        <p>{post.body}</p>
        {post.review_note && <small>Justificativa: {post.review_note}</small>}
        <div className="platform-admin__review-actions">
          {post.status!=='approved' && <button type="button" disabled={busy}
            onClick={()=>void review(post,'approved')}><Check size={15}/> Aprovar</button>}
          {post.status!=='rejected' && <button type="button" disabled={busy}
            onClick={()=>void review(post,'rejected')}><X size={15}/> Rejeitar</button>}
        </div>
      </article>)}
    </>}
    {error && <p role="alert" className="platform-admin__message is-error"><ShieldBan size={15}/> {error}</p>}
    {notice && <p role="status" className="platform-admin__message"><Check size={15}/> {notice}</p>}
  </div>;
};
