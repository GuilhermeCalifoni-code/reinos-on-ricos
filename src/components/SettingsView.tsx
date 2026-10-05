import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  CloudUpload,
  KeyRound,
  LogOut,
  Mail,
  Monitor,
  Save,
  ShieldCheck,
  Trash2,
  UserRound
} from 'lucide-react';
import { UserSession } from '../types/auth';
import { ThemeToggle } from '../design-system/ThemeToggle';
import { useTheme } from '../design-system/theme';
import { authService } from '../services/auth/authService';
import { profileAssetService } from '../services/storage/profileAssetService';
import { LocalMigrationReport } from '../services/migration/localCloudMigrationService';

interface SettingsViewProps {
  session: UserSession | null;
  onTrocarSessao: () => void;
  onRestaurarExemplos: () => void;
  onAtualizarSessao: (patch: Partial<UserSession>) => void;
  localDataSummary?: { campanhas: number; personagens: number; itens: number };
  onMigrarDadosLocais?: () => Promise<LocalMigrationReport>;
}

const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Não foi possível ler a imagem selecionada.'));
  reader.onload = () => resolve(String(reader.result));
  reader.readAsDataURL(file);
});

export const SettingsView: React.FC<SettingsViewProps> = ({
  session,
  onTrocarSessao,
  onRestaurarExemplos,
  onAtualizarSessao,
  localDataSummary,
  onMigrarDadosLocais
}) => {
  const { theme } = useTheme();
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
  const [migrandoDados, setMigrandoDados] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    setNome(session?.nome || '');
    setEmail(session?.email || '');
    setAvatarPreview(session?.avatarUrl || '');
  }, [session?.avatarUrl, session?.email, session?.nome]);

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
        await authService.atualizarPerfil({
          nome: nome.trim(),
          avatarUrl
        });

        if (email.trim() && email.trim().toLowerCase() !== (session.email || '').toLowerCase()) {
          const user = await authService.atualizarEmail(email.trim());
          emailAtual = user?.email || session.email;
          setMensagem('Perfil salvo. O Supabase pode pedir confirmação no novo e-mail antes de efetivar a troca.');
        } else {
          setMensagem('Perfil atualizado.');
        }
      } else {
        setMensagem('Perfil local atualizado neste navegador.');
      }

      onAtualizarSessao({
        nome: nome.trim(),
        email: emailAtual,
        avatarUrl
      });
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
        await profileAssetService.removeAvatar().catch(() => undefined);
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

  return (
    <section className="ro-settings">
      <header className="ro-settings__header">
        <div>
          <p className="ro-eyebrow">Preferências da Vigília</p>
          <h1>Configurações</h1>
          <p>Seu perfil, aparência e segurança em um único lugar.</p>
        </div>
        <div className="ro-settings__status">
          <ShieldCheck />
          <span>
            <strong>{remoto ? 'Conta online' : 'Modo local'}</strong>
            <small>{remoto ? 'Sincronizada pelo Supabase' : 'Dados salvos neste navegador'}</small>
          </span>
        </div>
      </header>

      {(mensagem || erro) && (
        <div className={erro ? 'ro-settings__feedback is-error' : 'ro-settings__feedback is-success'} role={erro ? 'alert' : 'status'}>
          {erro ? <AlertCircle /> : <CheckCircle2 />}
          <span>{erro || mensagem}</span>
        </div>
      )}

      <div className="ro-settings__grid">
        <section className="ro-settings__card ro-settings__card--profile">
          <div className="ro-settings__card-head">
            <span className="ro-settings__icon"><UserRound /></span>
            <div>
              <h2>Perfil</h2>
              <p>Como você aparece para sua mesa.</p>
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
              <span>{avatarFile ? `Nova imagem selecionada: ${avatarFile.name}` : 'Suas alterações ficam vinculadas à sua conta.'}</span>
              <button className="ro-button" disabled={salvandoPerfil}>
                <Save /> {salvandoPerfil ? 'Salvando…' : 'Salvar perfil'}
              </button>
            </div>
          </form>
        </section>

        <section className="ro-settings__card">
          <div className="ro-settings__card-head">
            <span className="ro-settings__icon"><Monitor /></span>
            <div>
              <h2>Aparência</h2>
              <p>Escolha como a plataforma deve ser lida durante a mesa.</p>
            </div>
          </div>

          <div className="ro-settings__theme-row">
            <div>
              <strong>{theme === 'dark' ? 'Vigília Noturna' : 'Arquivo da Vigília'}</strong>
              <small>
                {theme === 'dark'
                  ? 'Interface escura para sessões longas e ambientes com pouca luz.'
                  : 'Papel quente, contraste editorial e leitura clara.'}
              </small>
            </div>
            <ThemeToggle />
          </div>
        </section>

        {remoto && (
          <section className="ro-settings__card">
            <div className="ro-settings__card-head">
              <span className="ro-settings__icon"><KeyRound /></span>
              <div>
                <h2>Segurança</h2>
                <p>Defina ou altere uma senha para sua conta.</p>
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

            <p className="ro-settings__hint">
              Mesmo entrando com Google, você pode definir uma senha como alternativa de acesso.
            </p>
          </section>
        )}

        {remoto && onMigrarDadosLocais && (
          <section className="ro-settings__card ro-settings__card--sync">
            <div className="ro-settings__card-head">
              <span className="ro-settings__icon"><CloudUpload /></span>
              <div>
                <h2>Sincronização</h2>
                <p>Leve para a nuvem o que foi criado neste navegador antes da conta online.</p>
              </div>
            </div>

            <div className="ro-settings__sync">
              <div className="ro-settings__sync-counts">
                <span><strong>{localDataSummary?.campanhas ?? 0}</strong><small>campanhas locais</small></span>
                <span><strong>{localDataSummary?.personagens ?? 0}</strong><small>fichas locais</small></span>
                <span><strong>{localDataSummary?.itens ?? 0}</strong><small>itens de preparação</small></span>
              </div>
              <p>
                Contas online passam a usar o Supabase como fonte principal. Este botão serve para importar,
                uma única vez, os dados antigos que ainda existem apenas neste dispositivo.
              </p>
              <button
                type="button"
                className="ro-button"
                disabled={migrandoDados}
                onClick={() => void migrarDadosLocais()}
              >
                <CloudUpload /> {migrandoDados ? 'Enviando para a nuvem…' : 'Sincronizar este dispositivo'}
              </button>
            </div>
          </section>
        )}

        <section className="ro-settings__card">
          <div className="ro-settings__card-head">
            <span className="ro-settings__icon"><ShieldCheck /></span>
            <div>
              <h2>Sessão e conta</h2>
              <p>Informações desta sessão e saída segura.</p>
            </div>
          </div>

          <dl className="ro-settings__details">
            <div><dt>Conexão</dt><dd>{remoto ? 'Supabase / online' : 'Local'}</dd></div>
            <div><dt>Perfil</dt><dd>{session?.nome || 'Desvelado'}</dd></div>
            {session?.email && <div><dt>E-mail atual</dt><dd>{session.email}</dd></div>}
            <div><dt>Papel global</dt><dd>Definido por campanha</dd></div>
          </dl>

          <button type="button" className="ro-settings__logout" onClick={onTrocarSessao}>
            <LogOut /> {remoto ? 'Sair da conta' : 'Encerrar modo local'}
          </button>
        </section>

        {!remoto && (
          <section className="ro-settings__card">
            <div className="ro-settings__card-head">
              <span className="ro-settings__icon"><Monitor /></span>
              <div>
                <h2>Dados de demonstração</h2>
                <p>Restaure as fichas canônicas usadas no modo local.</p>
              </div>
            </div>

            <button
              type="button"
              className="ro-button--quiet"
              onClick={() => {
                if (confirm('Deseja restaurar as fichas de exemplo?')) onRestaurarExemplos();
              }}
            >
              Restaurar fichas de exemplo
            </button>
          </section>
        )}
      </div>
    </section>
  );
};
