import React, { useState } from 'react';
import { IMAGENS_ATMOSFERICAS_PREDEFINIDAS } from '../data/campaignsData';
import { CampanhaTipo } from '../types/campaign';

interface CreateCampaignViewProps {
  onCriar: (dados: {
    nome: string;
    descricao: string;
    imagemUrl: string;
    tipo: CampanhaTipo;
  }) => void;
  onCancelar: () => void;
}

export const CreateCampaignView: React.FC<CreateCampaignViewProps> = ({
  onCriar,
  onCancelar
}) => {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [imagemUrl, setImagemUrl] = useState(IMAGENS_ATMOSFERICAS_PREDEFINIDAS[0].url);
  const [tipo, setTipo] = useState<CampanhaTipo>('campanha');
  const [usarUrlCustom, setUsarUrlCustom] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    onCriar({
      nome: nome.trim(),
      descricao: descricao.trim() || 'Uma jornada pelas fissuras da vigília urbana.',
      imagemUrl: imagemUrl || IMAGENS_ATMOSFERICAS_PREDEFINIDAS[0].url,
      tipo
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-8 py-12">
      {/* Topo */}
      <div className="pb-8 border-b border-[#292929]">
        <h1 className="font-serif text-3xl sm:text-4xl text-[#F5F3EE] font-normal tracking-tight">
          Nova Campanha
        </h1>
        <p className="text-sm text-[#666666] mt-2">
          Crie um novo espaço para sua história.
        </p>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="pt-8 space-y-8">
        {/* Nome */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-[#666666] mb-2.5">
            Nome
          </label>
          <input
            type="text"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome da campanha..."
            className="w-full bg-[#171717] border border-[#292929] focus:border-[#A88952] focus:outline-none px-4 py-3 text-sm text-[#F5F3EE] placeholder-[#666666] transition-colors rounded-sm"
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-[#666666] mb-2.5">
            Descrição
          </label>
          <textarea
            rows={3}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descreva brevemente sua campanha..."
            className="w-full bg-[#171717] border border-[#292929] focus:border-[#A88952] focus:outline-none px-4 py-3 text-sm text-[#D9D7D2] placeholder-[#666666] transition-colors rounded-sm resize-none"
          />
        </div>

        {/* Imagem */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-mono uppercase tracking-widest text-[#666666]">
              Imagem Atmosférica
            </label>
            <button
              type="button"
              onClick={() => setUsarUrlCustom(!usarUrlCustom)}
              className="text-[11px] font-mono text-[#666666] hover:text-[#A88952] transition-colors"
            >
              {usarUrlCustom ? 'Escolher da Coleção' : 'Inserir URL direta'}
            </button>
          </div>

          {usarUrlCustom ? (
            <input
              type="url"
              value={imagemUrl}
              onChange={(e) => setImagemUrl(e.target.value)}
              placeholder="https://exemplo.com/imagem-urbana.jpg"
              className="w-full bg-[#171717] border border-[#292929] focus:border-[#A88952] focus:outline-none px-4 py-3 text-sm text-[#D9D7D2] placeholder-[#666666] transition-colors rounded-sm"
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {IMAGENS_ATMOSFERICAS_PREDEFINIDAS.map((img) => {
                const selecionada = imagemUrl === img.url;
                return (
                  <div
                    key={img.id}
                    onClick={() => setImagemUrl(img.url)}
                    className={`cursor-pointer overflow-hidden border rounded-sm relative aspect-video group transition-all ${
                      selecionada ? 'border-[#A88952]' : 'border-[#292929] hover:border-[#666666]'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.nome}
                      className="w-full h-full object-cover filter brightness-75 contrast-90"
                    />
                    <div className="absolute inset-0 bg-[#0B0B0B]/30" />
                    <div className="absolute bottom-1.5 left-2 right-2 text-[10px] text-[#F5F3EE] truncate drop-shadow">
                      {img.nome}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tipo */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-[#666666] mb-3">
            Tipo
          </label>
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-[#D9D7D2]">
              <input
                type="radio"
                name="tipo"
                value="campanha"
                checked={tipo === 'campanha'}
                onChange={() => setTipo('campanha')}
                className="accent-[#A88952] cursor-pointer"
              />
              <span>Campanha</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-[#D9D7D2]">
              <input
                type="radio"
                name="tipo"
                value="oneshot"
                checked={tipo === 'oneshot'}
                onChange={() => setTipo('oneshot')}
                className="accent-[#A88952] cursor-pointer"
              />
              <span>One-shot</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-[#D9D7D2]">
              <input
                type="radio"
                name="tipo"
                value="playtest"
                checked={tipo === 'playtest'}
                onChange={() => setTipo('playtest')}
                className="accent-[#A88952] cursor-pointer"
              />
              <span>Playtest</span>
            </label>
          </div>
        </div>

        {/* Botões Finais */}
        <div className="pt-6 border-t border-[#292929] flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={onCancelar}
            className="px-5 py-2.5 bg-transparent hover:bg-[#292929] text-[#666666] hover:text-[#D9D7D2] text-xs font-medium tracking-wide uppercase transition-colors rounded-sm"
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#A88952] hover:bg-[#75603D] text-[#0B0B0B] text-xs font-medium tracking-wide uppercase transition-colors rounded-sm"
          >
            <span>Criar Campanha</span>
            <span className="text-xs">→</span>
          </button>
        </div>
      </form>
    </div>
  );
};
