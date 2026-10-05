import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Accessibility,
  AlertCircle,
  Camera,
  CheckCircle2,
  CloudUpload,
  DatabaseBackup,
  Download,
  KeyRound,
  Laptop,
  LogOut,
  Mail,
  Monitor,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  UserRound
} from 'lucide-react';
import { UIPreferences, UserSession } from '../types/auth';
import { ThemeToggle } from '../design-system/ThemeToggle';
import { useTheme } from '../design-system/theme';
import { authService } from '../services/auth/authService';
import { profileAssetService } from '../services/storage/profileAssetService';
import { LocalMigrationReport } from '../services/migration/localCloudMigrationService';
import { normalizeUIPreferences } from '../services/preferences/uiPreferences';

interface SettingsViewProps {
  session: UserSession | null;
  onTrocarSessao: () => void;
  onAtualizarSessao: (patch: Partial<UserSession>) => void;
  onAtualizarPreferencias: (preferences: UIPreferences) => Promise<void>;
  onExportarDados: () => Promise<void>;
  onSairTodos: () => Promise<void>;
  localDataSummary?: { campanhas: number; personagens: number; itens: number };
  onMigrarDadosLocais?: () => Promise<LocalMigrationReport>;
}

interface AccountDetails {
  provider: string;
  createdAt?: string;
  lastSignInAt?: string;
}

const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Não foi possível ler a imagem selecionada.'));
  reader.onload = () => resolve(String(reader.result));
  reader.readAsDataURL(file);
});

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' });
};

const providerLabel = (provider?: string) => {
  if (provider === 'google') return 'Google';
  if (provider === 'discord') return 'Discord';
  if (provider === 'email') return 'E-mail e senha';
  return provider || 'Conta online';
};

export const SettingsView: React.FC<SettingsViewProps> = ({
  session,
  onTrocarSessao,
  onAtualizarSessao,
  onAtualizarPreferencias,
  onExportarDados,
  onSairTodos,
  localDataSummary,
  onMigrarDadosLocais
}) => {
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const remoto = session?.modoConexao === 'supabase';

  const [nome, setNome] = useState(session?.nome || '');
  const [email, setEmail] = useState(session?.email || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(session?.avatarUrl || '');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('');
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [salvandoPreferencias, setSalvandoPreferencias] = useState(false);
  const [migrandoDados, setMigrandoDados] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [saindoTodos, setSaindoTodos] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);
  const [preferences, setPreferences] = useState<UIPreferences>(
    normalizeUIPreferences(session?.uiPreferences)
  );

  useEffect(() => {
    setNome(session?.nome || '');
    setEmail(session?.email || '');
    setAvatarPreview(session?.avatarUrl || '');
    setPreferences(normalizeUIPreferences(session?.uiPreferences));
  }, [session?.avatarUrl, session?.email, session?.nome, session?.uiPreferences]);

  useEffect(() => {
    if (!remoto) {
      setAccountDetails(null);
      return;
    }
    let active = true;
    void authService.detalhesConta()
      .then(details => { if (active) setAccountDetails(details); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [remoto]);

  useEffect(() => {
    if (!avatarFile) return;
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const iniciais = useMemo(
    () => (nome || session?.nome || 'RO').trim().split(/\s+/).slice(0, 2).map(parte => parte[0]).join('').toUpperCase(),
    [nome, session?.nome]
  );

  const limparFeedback = () => {
    setMensagem('');
    setErro('');
  };

  const navegar = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const escolherAvatar = (file?: File) => {
    limparFeedback();
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErro('Selecione uma imagem PNG, JPG, WEBP ou GIF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErro('A imagem de perfil deve ter no máximo 5 MB.');
      return;
    }
    setAvatarFile(file);
  };

  const salvarPerfil = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session || salvandoPerfil) return;

    limparFeedback();
    if (!nome.trim()) {
      setErro('Informe como você quer ser chamado na plataforma.');
      return;
    }

    setSalvandoPerfil(true);
    try {
      let avatarUrl = session.avatarUrl;

      if (avatarFile) {
        avatarUrl = remoto
          ? await profileAssetService.uploadAvatar(avatarFile)
          : await fileToDataUrl(avatarFile);
      }

      let emailAtual = session.email;

      if (remoto) {
        await authService.atualizarPerfil({ nome: nome.trim(), avatarUrl });

        if (email.trim() && email.trim().toLowerCase() !== (session.email || '').toLowerCase()) {
          const user = await authService.atualizarEmail(email.trim());
          emailAtual = user?.email || session.email;
          setMensagem('Perfil salvo. A troca de e-mail pode exigir confirmação antes de entrar em vigor.');
        } else {
          setMensagem('Perfil atualizado.');
        }
      } else {
        setMensagem('Perfil local atualizado neste navegador.');
      }

      onAtualizarSessao({ nome: nome.trim(), email: emailAtual, avatarUrl });
      setAvatarFile(null);
    } catch (error: any) {
      setErro(error.message || 'Não foi possível salvar seu perfil.');
    } finally {
      setSalvandoPerfil(false);
    }
  };

  const removerAvatar = async () => {
    if (!session || salvandoPerfil) return;
    limparFeedback();
    setSalvandoPerfil(true);

    try {
      if (remoto) {
        await profileAssetService.removeAvatar();
        await authService.atualizarPerfil({ nome: nome.trim() || session.nome, avatarUrl: undefined });
      }

      setAvatarFile(null);
      setAvatarPreview('');
      onAtualizarSessao({ avatarUrl: undefined });
      setMensagem('Imagem de perfil removida.');
    } catch (error: any) {
      setErro(error.message || 'Não foi possível remover a imagem de perfil.');
    } finally {
      setSalvandoPerfil(false);
    }
  };

  const salvarAparencia = async () => {
    limparFeedback();
    setSalvandoPreferencias(true);
    try {
      const next: UIPreferences = {
        ...preferences,
        theme
      };
      await onAtualizarPreferencias(next);
      setPreferences(normalizeUIPreferences(next));
      setMensagem('Preferências de interface salvas e sincronizadas.');
    } catch (error: any) {
      setErro(error.message || 'Não foi possível salvar as preferências.');
    } finally {
      setSalvandoPreferencias(false);
    }
  };

  const restaurarAparencia = async () => {
    const next: UIPreferences = {
      theme: 'light',
      density: 'comfortable',
      textScale: 'normal',
      reduceMotion: false
    };
    setTheme('light');
    setPreferences(next);
    try {
      await onAtualizarPreferencias(next);
      setMensagem('Preferências restauradas ao padrão.');
    } catch (error: any) {
      setErro(error.message || 'Não foi possível restaurar as preferências.');
    }
  };

  const migrarDadosLocais = async () => {
    if (!onMigrarDadosLocais || migrandoDados) return;
    limparFeedback();

    const confirmed = confirm(
      'Enviar os dados salvos neste navegador para sua conta online?\n\n' +
      'Isso é recomendado para que campanhas, fichas e preparação apareçam em outros dispositivos.'
    );
    if (!confirmed) return;

    setMigrandoDados(true);
    try {
      const result = await onMigrarDadosLocais();
      setMensagem(
        `Sincronização concluída: ${result.campanhasCriadas} campanhas enviadas, ` +
        `${result.campanhasJaMigradas} já estavam na nuvem e ${result.personagens} fichas sincronizadas.`
      );
    } catch (error: any) {
      setErro(error.message || 'Não foi possível enviar os dados deste dispositivo para a nuvem.');
    } finally {
      setMigrandoDados(false);
    }
  };

  const exportarDados = async () => {
    limparFeedback();
    setExportando(true);
    try {
      await onExportarDados();
      setMensagem('Backup gerado. O arquivo foi enviado para seus downloads.');
    } catch (error: any) {
      setErro(error.message || 'Não foi possível gerar o backup.');
    } finally {
      setExportando(false);
    }
  };

  const alterarSenha = async (event: React.FormEvent) => {
    event.preventDefault();
    limparFeedback();

    if (!remoto) {
      setErro('Senha só existe nas contas conectadas ao Supabase.');
      return;
    }
    if (novaSenha.length < 6) {
      setErro('A nova senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmacaoSenha) {
      setErro('As duas senhas não coincidem.');
      return;
    }

    setSalvandoSenha(true);
    try {
      await authService.atualizarSenha(novaSenha);
      setNovaSenha('');
      setConfirmacaoSenha('');
      setMensagem('Senha atualizada com sucesso.');
    } catch (error: any) {
      setErro(error.message || 'Não foi possível atualizar a senha.');
    } finally {
      setSalvandoSenha(false);
    }
  };

  const enviarRecuperacao = async () => {
    if (!session?.email) return;
    limparFeedback();
    try {
      await authService.recuperarSenha(session.email);
      setMensagem('Link de redefinição enviado para seu e-mail.');
    } catch (error: any) {
      setErro(error.message || 'Não foi possível enviar o link de redefinição.');
    }
  };

  const sairTodos = async () => {
    if (saindoTodos) return;
    const confirmed = confirm('Encerrar sua sessão em todos os dispositivos conectados?');
    if (!confirmed) return;
    setSaindoTodos(true);
    try {
      await onSairTodos();
    } catch (error: any) {
      setErro(error.message || 'Não foi possível encerrar todas as sessões.');
      setSaindoTodos(false);
    }
  };

  return (
    <section className="ro-settings">
      <header className="ro-settings__header">
        <div>
          <p className="ro-eyebrow">Preferências da Vigília</p>
          <h1>Configurações</h1>
          <p>Perfil, aparência, acessibilidade, segurança e seus dados em um único lugar.</p>
        </div>
        <div className="ro-settings__status">
          <ShieldCheck />
          <span>
            <strong>{remoto ? 'Conta online' : 'Modo local'}</strong>
            <small>{remoto ? 'Sincronizada pelo Supabase' : 'Dados salvos neste navegador'}</small>
          </span>
        </div>
      </header>

      <nav className="ro-settings__nav" aria-label="Seções de configurações">
        <button type="button" onClick={() => navegar('settings-profile')}><UserRound /> Perfil</button>
        <button type="button" onClick={() => navegar('settings-appearance')}><Monitor /> Aparência</button>
        {remoto && <button type="button" onClick={() => navegar('settings-security')}><KeyRound /> Segurança</button>}
        <button type="button" onClick={() => navegar('settings-data')}><DatabaseBackup /> Dados</button>
        <button type="button" onClick={() => navegar('settings-session')}><Laptop /> Sessão</button>
      </nav>

      {(mensagem || erro) && (
        <div className={erro ? 'ro-settings__feedback is-error' : 'ro-settings__feedback is-success'} role={erro ? 'alert' : 'status'}>
          {erro ? <AlertCircle /> : <CheckCircle2 />}
          <span>{erro || mensagem}</span>
        </div>
      )}

      <div className="ro-settings__grid">
        <section id="settings-profile" className="ro-settings__card ro-settings__card--profile">
          <div className="ro-settings__card-head">
            <span className="ro-settings__icon"><UserRound /></span>
            <div>
              <h2>Perfil</h2>
              <p>Como você aparece para sua mesa e para outros Desvelados.</p>
            </div>
          </div>

          <form onSubmit={salvarPerfil} className="ro-settings__profile-form">
            <div className="ro-settings__avatar-area">
              <button
                type="button"
                className="ro-settings__avatar"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Trocar imagem de perfil"
              >
                {avatarPreview ? <img src={avatarPreview} alt="" /> : <span>{iniciais}</span>}
                <i><Camera /></i>
              </button>

              <div className="ro-settings__avatar-actions">
                <strong>Imagem de perfil</strong>
                <small>PNG, JPG, WEBP ou GIF · até 5 MB</small>
                <div>
                  <button type="button" className="ro-button--quiet" onClick={() => fileInputRef.current?.click()}>
                    <Camera /> {avatarPreview ? 'Trocar imagem' : 'Adicionar imagem'}
                  </button>
                  {avatarPreview && (
                    <button type="button" className="ro-settings__danger-link" onClick={() => void removerAvatar()}>
                      <Trash2 /> Remover
                    </button>
                  )}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                hidden
                onChange={event => {
                  escolherAvatar(event.target.files?.[0]);
                  event.target.value = '';
                }}
              />
            </div>

            <div className="ro-settings__fields">
              <label>
                <span>Nome de exibição</span>
                <div className="ro-settings__input">
                  <UserRound />
                  <input value={nome} onChange={event => setNome(event.target.value)} placeholder="Como devemos chamar você?" required />
                </div>
              </label>

              {remoto && (
                <label>
                  <span>E-mail</span>
                  <div className="ro-settings__input">
                    <Mail />
                    <input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="voce@exemplo.com" />
                  </div>
                  <small>Trocas de e-mail podem exigir confirmação antes de entrarem em vigor.</small>
                </label>
              )}
            </div>

            <div className="ro-settings__card-footer">
              <span>{avatarFile ? `Nova imagem selecionada: ${avatarFile.name}` : 'Essas informações acompanham sua conta em outros dispositivos.'}</span>
              <button className="ro-button" disabled={salvandoPerfil}>
                <Save /> {salvandoPerfil ? 'Salvando…' : 'Salvar perfil'}
              </button>
            </div>
          </form>
        </section>

        <section id="settings-appearance" className="ro-settings__card ro-settings__card--wide">
          <div className="ro-settings__card-head">
            <span className="ro-settings__icon"><Monitor /></span>
            <div>
              <h2>Aparência e acessibilidade</h2>
              <p>Ajuste a leitura da plataforma para sua mesa, monitor e ambiente.</p>
            </div>
          </div>

          <div className="ro-settings__appearance">
            <div className="ro-settings__preference-row">
              <div>
                <strong>Tema</strong>
                <small>Claro para leitura editorial; escuro para sessões longas e ambientes com pouca luz.</small>
              </div>
              <ThemeToggle />
            </div>

            <div className="ro-settings__preference-row">
              <div>
                <strong>Densidade da interface</strong>
                <small>Compacta mostra mais informação; confortável dá mais espaço entre controles.</small>
              </div>
              <div className="ro-settings__segmented">
                <button type="button" className={preferences.density === 'comfortable' ? 'is-active' : ''} onClick={() => setPreferences(current => ({ ...current, density: 'comfortable' }))}>Confortável</button>
                <button type="button" className={preferences.density === 'compact' ? 'is-active' : ''} onClick={() => setPreferences(current => ({ ...current, density: 'compact' }))}>Compacta</button>
              </div>
            </div>

            <div className="ro-settings__preference-row">
              <div>
                <strong>Tamanho do texto</strong>
                <small>Afeta toda a interface, inclusive fichas, campanhas e Mesa Ao Vivo.</small>
              </div>
              <div className="ro-settings__segmented">
                {(['small', 'normal', 'large'] as const).map(value => (
                  <button key={value} type="button" className={preferences.textScale === value ? 'is-active' : ''} onClick={() => setPreferences(current => ({ ...current, textScale: value }))}>
                    {value === 'small' ? 'Menor' : value === 'large' ? 'Maior' : 'Padrão'}
                  </button>
                ))}
              </div>
            </div>

            <div className="ro-settings__preference-row">
              <div>
                <strong>Reduzir animações</strong>
                <small>Desativa movimentos e transições para reduzir distração e enjoo visual.</small>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(preferences.reduceMotion)}
                className={`ro-settings__switch ${preferences.reduceMotion ? 'is-on' : ''}`}
                onClick={() => setPreferences(current => ({ ...current, reduceMotion: !current.reduceMotion }))}
              >
                <span />
              </button>
            </div>

            <div className="ro-settings__appearance-actions">
              <button type="button" className="ro-button--quiet" onClick={() => void restaurarAparencia()}>
                <RotateCcw /> Restaurar padrão
              </button>
              <button type="button" className="ro-button" disabled={salvandoPreferencias} onClick={() => void salvarAparencia()}>
                <Save /> {salvandoPreferencias ? 'Salvando…' : 'Salvar aparência'}
              </button>
            </div>
          </div>
        </section>

        {remoto && (
          <section id="settings-security" className="ro-settings__card">
            <div className="ro-settings__card-head">
              <span className="ro-settings__icon"><KeyRound /></span>
              <div>
                <h2>Segurança</h2>
                <p>Senha, recuperação e controle das sessões conectadas.</p>
              </div>
            </div>

            <form onSubmit={alterarSenha} className="ro-settings__security-form">
              <label>
                <span>Nova senha</span>
                <input type="password" autoComplete="new-password" value={novaSenha} onChange={event => setNovaSenha(event.target.value)} placeholder="Mínimo de 6 caracteres" />
              </label>
              <label>
                <span>Confirmar senha</span>
                <input type="password" autoComplete="new-password" value={confirmacaoSenha} onChange={event => setConfirmacaoSenha(event.target.value)} placeholder="Repita a nova senha" />
              </label>
              <button className="ro-button--quiet" disabled={salvandoSenha || !novaSenha}>
                <KeyRound /> {salvandoSenha ? 'Atualizando…' : 'Atualizar senha'}
              </button>
            </form>

            <div className="ro-settings__security-actions">
              <button type="button" className="ro-button--quiet" onClick={() => void enviarRecuperacao()}>
                <Mail /> Enviar link de redefinição
              </button>
              <button type="button" className="ro-settings__danger-action" disabled={saindoTodos} onClick={() => void sairTodos()}>
                <LogOut /> {saindoTodos ? 'Encerrando…' : 'Sair de todos os dispositivos'}
              </button>
            </div>
          </section>
        )}

        <section id="settings-data" className="ro-settings__card">
          <div className="ro-settings__card-head">
            <span className="ro-settings__icon"><DatabaseBackup /></span>
            <div>
              <h2>Dados e backup</h2>
              <p>Exporte uma cópia dos dados que sua conta pode acessar.</p>
            </div>
          </div>

          <div className="ro-settings__data-actions">
            <button type="button" className="ro-button" disabled={exportando} onClick={() => void exportarDados()}>
              <Download /> {exportando ? 'Gerando backup…' : 'Baixar backup JSON'}
            </button>
            <p>O backup inclui perfil, campanhas, fichas e registros disponíveis para sua conta. Arquivos grandes do Storage permanecem referenciados por URL/caminho.</p>
          </div>
        </section>

        {remoto && onMigrarDadosLocais && (
          <section className="ro-settings__card ro-settings__card--sync">
            <div className="ro-settings__card-head">
              <span className="ro-settings__icon"><CloudUpload /></span>
              <div>
                <h2>Sincronização deste dispositivo</h2>
                <p>Leve para a nuvem o que foi criado aqui antes da conta online.</p>
              </div>
            </div>

            <div className="ro-settings__sync">
              <div className="ro-settings__sync-counts">
                <span><strong>{localDataSummary?.campanhas ?? 0}</strong><small>campanhas locais</small></span>
                <span><strong>{localDataSummary?.personagens ?? 0}</strong><small>fichas locais</small></span>
                <span><strong>{localDataSummary?.itens ?? 0}</strong><small>itens de preparação</small></span>
              </div>
              <p>Use isto uma vez em cada navegador antigo que ainda possua conteúdo que não foi enviado ao Supabase.</p>
              <button type="button" className="ro-button" disabled={migrandoDados} onClick={() => void migrarDadosLocais()}>
                <CloudUpload /> {migrandoDados ? 'Enviando para a nuvem…' : 'Sincronizar este dispositivo'}
              </button>
            </div>
          </section>
        )}

        <section id="settings-session" className="ro-settings__card">
          <div className="ro-settings__card-head">
            <span className="ro-settings__icon"><Laptop /></span>
            <div>
              <h2>Sessão e conta</h2>
              <p>Veja como esta conta está conectada e encerre a sessão atual.</p>
            </div>
          </div>

          <dl className="ro-settings__details">
            <div><dt>Conexão</dt><dd>{remoto ? 'Supabase / online' : 'Local'}</dd></div>
            <div><dt>Perfil</dt><dd>{session?.nome || 'Desvelado'}</dd></div>
            {session?.email && <div><dt>E-mail atual</dt><dd>{session.email}</dd></div>}
            {remoto && <div><dt>Login principal</dt><dd>{providerLabel(accountDetails?.provider)}</dd></div>}
            {remoto && <div><dt>Conta criada</dt><dd>{formatDate(accountDetails?.createdAt)}</dd></div>}
            {remoto && <div><dt>Último acesso</dt><dd>{formatDate(accountDetails?.lastSignInAt)}</dd></div>}
            <div><dt>Papel global</dt><dd>Definido por campanha</dd></div>
          </dl>

          <button type="button" className="ro-settings__logout" onClick={onTrocarSessao}>
            <LogOut /> {remoto ? 'Sair deste dispositivo' : 'Encerrar modo local'}
          </button>
        </section>

        <section className="ro-settings__card">
          <div className="ro-settings__card-head">
            <span className="ro-settings__icon"><Accessibility /></span>
            <div>
              <h2>Ajuda de uso</h2>
              <p>As configurações foram organizadas para não esconder ações importantes durante a mesa.</p>
            </div>
          </div>
          <p className="ro-settings__hint">
            Perfil e aparência acompanham a conta online. Campanhas, fichas e preparação são salvos no Supabase quando você está conectado. O modo local continua restrito ao navegador.
          </p>
        </section>
      </div>
    </section>
  );
};
