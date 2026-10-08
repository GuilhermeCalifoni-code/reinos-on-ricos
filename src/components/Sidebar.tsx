import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  HeartHandshake,
  Home,
  LogOut,
  Map,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  Users,
  X
} from 'lucide-react';
export type MainViewType =
  | 'dashboard'
  | 'campanhas'
  | 'personagens'
  | 'compendio'
  | 'comunidade'
  | 'criar_campanha'
  | 'detalhe_campanha'
  | 'modo_mesa'
  | 'configuracoes'
  | 'administracao';

interface SidebarProps {
  viewAtiva: MainViewType;
  setViewAtiva: (v: MainViewType) => void;
  onNovaCampanha: () => void;
  onSair: () => void;
  canAccessAdmin?: boolean;
}

const SIDEBAR_COLLAPSED_KEY = 'reinos_oniricos_sidebar_collapsed_v1';

const isSectionActive = (view: MainViewType, section: MainViewType) =>
  view === section || (section === 'campanhas' && view === 'detalhe_campanha');

const navItems: Array<{
  id: MainViewType;
  label: string;
  icon: React.ElementType;
}> = [
  { id: 'dashboard', label: 'Início', icon: Home },
  { id: 'campanhas', label: 'Minhas Campanhas', icon: Map },
  { id: 'personagens', label: 'Personagens', icon: Users },
  { id: 'compendio', label: 'Compêndio', icon: BookOpen },
  { id: 'comunidade', label: 'Comunidade', icon: HeartHandshake }
];

export const Sidebar: React.FC<SidebarProps> = ({
  viewAtiva,
  setViewAtiva,
  onNovaCampanha,
  onSair,
  canAccessAdmin = false
}) => {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setCollapsed(current => {
      const next = !current;
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      } catch {
        // Preferência visual: falhar silenciosamente mantém a navegação funcional.
      }
      return next;
    });
  };

  return (
    <aside className={`ro-sidebar ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="ro-sidebar__brand-row">
        <button onClick={() => setViewAtiva('dashboard')} className="ro-sidebar__brand" aria-label="Ir para o início">
          <img src="/ro-login-logo.webp" alt="Reinos Oníricos RPG" />
        </button>
        <button
          type="button"
          className="ro-sidebar__collapse"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </button>
      </div>

      <nav className="ro-sidebar__nav" aria-label="Navegação principal">
        {canAccessAdmin && <button onClick={() => setViewAtiva('administracao')}
          className={viewAtiva === 'administracao' ? 'is-active' : ''}
          title={collapsed ? 'Administração' : undefined}>
          <ShieldCheck/><span>Administração</span>
        </button>}
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setViewAtiva(id)}
            className={isSectionActive(viewAtiva, id) ? 'is-active' : ''}
            title={collapsed ? label : undefined}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}

      </nav>

      <div className="ro-sidebar__art" aria-hidden="true">
        <img src="/ro-login-mist-city.webp" alt="" />
      </div>

      <div className="ro-sidebar__footer">
        <button
          onClick={() => setViewAtiva('configuracoes')}
          className={isSectionActive(viewAtiva, 'configuracoes') ? 'is-active' : ''}
          title={collapsed ? 'Configurações' : undefined}
        >
          <Settings /> <span>Configurações</span>
        </button>
        <button onClick={onSair} title={collapsed ? 'Sair' : undefined}>
          <LogOut /> <span>Sair</span>
        </button>
        <button onClick={onNovaCampanha} className="ro-sidebar__new" title="Nova campanha">
          <span>Nova campanha</span><strong>+</strong>
        </button>
      </div>
    </aside>
  );
};

interface MobileNavigationProps {
  viewAtiva: MainViewType;
  setViewAtiva: (v: MainViewType) => void;
  onNovaCampanha: () => void;
  onSair: () => void;
  canAccessAdmin?: boolean;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  viewAtiva,
  setViewAtiva,
  onNovaCampanha,
  onSair,
  canAccessAdmin = false
}) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [viewAtiva]);

  const navigate = (view: MainViewType) => {
    setViewAtiva(view);
    setOpen(false);
  };

  return (
    <>
      <header className="ro-mobile-shell">
        <button
          type="button"
          className="ro-mobile-shell__menu"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={open}
        >
          <Menu />
        </button>
        <button type="button" className="ro-mobile-shell__brand" onClick={() => navigate('dashboard')}>
          <img src="/ro-login-logo.webp" alt="Reinos Oníricos RPG" />
        </button>
        <button type="button" className="ro-mobile-shell__new" onClick={onNovaCampanha} aria-label="Criar campanha">
          +
        </button>
      </header>

      {open && (
        <div className="ro-mobile-drawer" role="dialog" aria-modal="true" aria-label="Menu principal">
          <button className="ro-mobile-drawer__backdrop" type="button" onClick={() => setOpen(false)} aria-label="Fechar menu" />
          <aside className="ro-mobile-drawer__panel">
            <div className="ro-mobile-drawer__head">
              <img src="/ro-login-logo.webp" alt="Reinos Oníricos RPG" />
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar menu"><X /></button>
            </div>

            <nav>
              {canAccessAdmin && <button type="button" onClick={() => navigate('administracao')}
                className={viewAtiva === 'administracao' ? 'is-active' : ''}>
                <ShieldCheck/><span>Administração</span>
              </button>}
              {navItems.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" onClick={() => navigate(id)} className={isSectionActive(viewAtiva, id) ? 'is-active' : ''}>
                  <Icon /><span>{label}</span>
                </button>
              ))}
            </nav>

            <div className="ro-mobile-drawer__footer">
              <button type="button" onClick={() => navigate('configuracoes')} className={viewAtiva === 'configuracoes' ? 'is-active' : ''}>
                <Settings /><span>Configurações</span>
              </button>
              <button type="button" onClick={onSair}><LogOut /><span>Sair</span></button>
              <button type="button" className="ro-mobile-drawer__primary" onClick={() => { onNovaCampanha(); setOpen(false); }}>
                <span>Nova campanha</span><strong>+</strong>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
