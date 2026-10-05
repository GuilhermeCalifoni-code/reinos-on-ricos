// Armazenamento e Gerenciamento Local de Personagens
import { useState, useEffect, useCallback } from 'react';
import { Personagem } from '../types/character';
import { TABELA_PROGRESSAO } from '../rules/rulesData';
import { 
  calcularResistencia, 
  calcularDefesa, 
  calcularVidaMaxima, 
  calcularProtecaoOniricaMaxima 
} from '../rules/rulesEngine';

const STORAGE_KEY = 'reinos_oniricos_personagens_v1';
const ACTIVE_CHAR_KEY = 'reinos_oniricos_ativo_id_v1';

export function useCharacterStorage(mesaCodigo: string = 'ONIRICO-01') {
  const [personagens, setPersonagens] = useState<Personagem[]>(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Erro ao ler personagens do storage:', e);
    }
    return [];
  });

  const [personagemAtivoId, setPersonagemAtivoId] = useState<string>(() => {
    try {
      const salvo = localStorage.getItem(ACTIVE_CHAR_KEY);
      if (salvo) return salvo;
    } catch (e) {
      console.error('Erro ao ler ID do personagem ativo:', e);
    }
    return '';
  });


  // Salva no localStorage quando os personagens mudam
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(personagens));
    } catch (e) {
      console.error('Erro ao salvar no storage:', e);
    }
  }, [personagens]);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_CHAR_KEY, personagemAtivoId);
    } catch (e) {
      console.error('Erro ao salvar personagem ativo:', e);
    }
  }, [personagemAtivoId]);

  const personagemAtivo = personagens.find(p => p.id === personagemAtivoId) || personagens[0] || null;

  const salvarPersonagem = useCallback((personagemAtualizado: Personagem) => {
    // Recalcula derivados automaticamente
    const r = calcularResistencia(personagemAtualizado.atributos.corpo);
    const def = calcularDefesa(
      personagemAtualizado.atributoPrincipal,
      personagemAtualizado.atributos,
      personagemAtualizado.nivel
    ).defesa;
    const vMax = calcularVidaMaxima(personagemAtualizado.nivel);
    const poMax = calcularProtecaoOniricaMaxima(personagemAtualizado.nivel);
    const focoMax = TABELA_PROGRESSAO[personagemAtualizado.nivel]?.focoBase ?? 4;

    const normalizado: Personagem = {
      ...personagemAtualizado,
      resistencia: r,
      defesa: def,
      vidaMaxima: vMax,
      vidaAtual: Math.min(personagemAtualizado.vidaAtual, vMax),
      protecaoOniricaMaxima: poMax,
      protecaoOniricaAtual: Math.min(personagemAtualizado.protecaoOniricaAtual, poMax),
      focoMaximo: focoMax,
      focoAtual: Math.min(personagemAtualizado.focoAtual, focoMax),
      atualizadoEm: new Date().toISOString()
    };

    setPersonagens(prev => {
      const index = prev.findIndex(p => p.id === normalizado.id);
      if (index >= 0) {
        const novoArray = [...prev];
        novoArray[index] = normalizado;
        return novoArray;
      } else {
        return [...prev, normalizado];
      }
    });

  }, [mesaCodigo]);

  const criarNovoPersonagem = useCallback((nome?: string) => {
    const novo: Personagem = {
      id: 'desvelado-' + Date.now(),
      nome: nome || 'Novo Desvelado',
      conceito: 'Lúcido',
      nivel: 1,
      atributos: {
        corpo: 2,
        mente: 1,
        vontade: 0,
        vinculo: -1
      },
      atributoPrincipal: 'corpo',
      vidaMaxima: 4,
      vidaAtual: 4,
      resistencia: 8, // 6 + 2
      defesa: 10,     // 8 + 2
      protecaoOniricaMaxima: 2,
      protecaoOniricaAtual: 2,
      focoMaximo: 4,
      focoAtual: 4,
      ruptura: 0,
      historicoRuptura: [],
      dominios: {
        consciencia: 0,
        espaco: 2,
        fluxo: 0,
        substancia: 0,
        vida: 3
      },
      ancoragem: '',
      vinculos: [],
      recursos: [{ id: 'rec-1', nome: 'Recursos 1', descricao: 'Escasso' }],
      equipamentos: [],
      percepcaoOniricaNotas: '',
      anotacoesGerais: '',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };

    setPersonagens(prev => [...prev, novo]);
    setPersonagemAtivoId(novo.id);
    return novo;
  }, []);

  const duplicarPersonagem = useCallback((id: string) => {
    const original = personagens.find(p => p.id === id);
    if (!original) return;

    const copia: Personagem = {
      ...JSON.parse(JSON.stringify(original)),
      id: 'desvelado-' + Date.now(),
      nome: `${original.nome} (Cópia)`,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };

    setPersonagens(prev => [...prev, copia]);
    setPersonagemAtivoId(copia.id);
  }, [personagens]);

  const excluirPersonagem = useCallback((id: string) => {
    setPersonagens(prev => {
      const filtrados = prev.filter(p => p.id !== id);
      return filtrados;
    });

    if (personagemAtivoId === id) {
      const restantes = personagens.filter(p => p.id !== id);
      if (restantes.length > 0) {
        setPersonagemAtivoId(restantes[0].id);
      } else {
        setPersonagemAtivoId('');
      }
    }

  }, [personagemAtivoId, personagens]);

  const mesclarPersonagens = useCallback((recebidos: Personagem[]) => {
    setPersonagens(atuais => {
      const porId = new Map(atuais.map(item => [item.id, item]));
      recebidos.forEach(item => porId.set(item.id, item));
      return Array.from(porId.values());
    });
  }, []);

  const exportarJSON = useCallback((personagem: Personagem) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(personagem, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${personagem.nome.toLowerCase().replace(/\s+/g, '_')}_reinos_oniricos.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, []);

  const importarJSON = useCallback((jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.nome || !parsed.atributos || !parsed.dominios) {
        alert('Arquivo JSON inválido para a ficha de Reinos Oníricos.');
        return false;
      }
      const novoId = 'desvelado-import-' + Date.now();
      const novoImportado: Personagem = {
        ...parsed,
        id: novoId,
        atualizadoEm: new Date().toISOString()
      };
      setPersonagens(prev => [...prev, novoImportado]);
      setPersonagemAtivoId(novoId);
      return true;
    } catch (e) {
      console.error('Falha ao importar JSON:', e);
      alert('Erro ao processar arquivo JSON.');
      return false;
    }
  }, []);

  return {
    personagens,
    personagemAtivo,
    personagemAtivoId,
    setPersonagemAtivoId,
    salvarPersonagem,
    criarNovoPersonagem,
    duplicarPersonagem,
    excluirPersonagem,
    mesclarPersonagens,
    exportarJSON,
    importarJSON
  };
}
