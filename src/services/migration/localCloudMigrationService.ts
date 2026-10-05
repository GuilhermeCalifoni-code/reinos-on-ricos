import {
  Adversario,
  Anotacao,
  Campanha,
  Cena,
  Contador,
  Handout,
  Local,
  LoreEntry,
  MapaNarrativo,
  NPC,
  Pista,
  Sessao,
  TokenMapa
} from '../../types/campaign';
import { Personagem } from '../../types/character';
import { campaignRepository } from '../campaigns/campaignRepository';
import { campaignContentRepository } from '../campaigns/campaignContentRepository';
import { characterRepository } from '../characters/characterRepository';
import { liveTableRepository } from '../../features/realtime/liveTableRepository';

export interface LocalWorkspaceSnapshot {
  campanhas: Campanha[];
  sessoes: Sessao[];
  npcs: NPC[];
  adversarios: Adversario[];
  locais: Local[];
  pistas: Pista[];
  loreEntries: LoreEntry[];
  anotacoes: Anotacao[];
  cenas: Cena[];
  handouts: Handout[];
  contadores: Contador[];
  mapas: MapaNarrativo[];
  tokensMapa: TokenMapa[];
  personagens: Personagem[];
}

export interface LocalMigrationReport {
  campanhasCriadas: number;
  campanhasJaMigradas: number;
  personagens: number;
  sessoes: number;
  npcs: number;
  adversarios: number;
  locais: number;
  pistas: number;
  lore: number;
  anotacoes: number;
  cenas: number;
  handouts: number;
  contadores: number;
  mapas: number;
  tokens: number;
}

const inCampaign = <T extends { campanhaId?: string }>(items: T[], campaignId: string) =>
  items.filter(item => item.campanhaId === campaignId);

export const localCloudMigrationService = {
  async migrate(
    snapshot: LocalWorkspaceSnapshot,
    userId: string,
    onProgress?: (message: string) => void
  ): Promise<LocalMigrationReport> {
    const report: LocalMigrationReport = {
      campanhasCriadas: 0,
      campanhasJaMigradas: 0,
      personagens: 0,
      sessoes: 0,
      npcs: 0,
      adversarios: 0,
      locais: 0,
      pistas: 0,
      lore: 0,
      anotacoes: 0,
      cenas: 0,
      handouts: 0,
      contadores: 0,
      mapas: 0,
      tokens: 0
    };

    const campaignMap = new Map<string, string>();

    for (const localCampaign of snapshot.campanhas) {
      onProgress?.(`Preparando “${localCampaign.nome}”…`);

      const already = await campaignRepository.buscarPorLegacyLocalId(localCampaign.id);
      if (already) {
        campaignMap.set(localCampaign.id, already.id);
        report.campanhasJaMigradas += 1;
        continue;
      }

      const created = await campaignRepository.criar({
        nome: localCampaign.nome,
        descricao: localCampaign.descricao,
        imagemUrl: localCampaign.imagemUrl,
        tipo: localCampaign.tipo
      });

      try {
        await campaignRepository.marcarLegacyLocalId(created.id, localCampaign.id);
        await campaignRepository.atualizar(created.id, {
          status: localCampaign.status,
          sessaoAtual: localCampaign.sessaoAtual,
          rupturaGeral: localCampaign.rupturaGeral,
          descricao: localCampaign.descricao,
          nome: localCampaign.nome
        });

        campaignMap.set(localCampaign.id, created.id);
        report.campanhasCriadas += 1;

        const sessions = inCampaign(snapshot.sessoes, localCampaign.id)
          .slice()
          .sort((a, b) => a.numero - b.numero);

        for (const session of sessions) {
          await campaignContentRepository.criarSessao(created.id, {
            titulo: session.titulo,
            data: session.data,
            descricao: session.descricao || session.resumo,
            status: session.status || (session.concluida ? 'concluida' : 'planejamento'),
            anotacoesMestre: session.anotacoesMestre
          });
          report.sessoes += 1;
        }

        for (const item of inCampaign(snapshot.npcs, localCampaign.id)) {
          const { id: _id, campanhaId: _campaign, ...draft } = item;
          await campaignContentRepository.adicionarNPC({ ...draft, campanhaId: created.id });
          report.npcs += 1;
        }

        for (const item of inCampaign(snapshot.adversarios, localCampaign.id)) {
          const { id: _id, campanhaId: _campaign, ...draft } = item;
          await campaignContentRepository.adicionarAdversario({ ...draft, campanhaId: created.id });
          report.adversarios += 1;
        }

        for (const item of inCampaign(snapshot.locais, localCampaign.id)) {
          const { id: _id, campanhaId: _campaign, ...draft } = item;
          await campaignContentRepository.adicionarLocal({ ...draft, campanhaId: created.id });
          report.locais += 1;
        }

        for (const item of inCampaign(snapshot.pistas, localCampaign.id)) {
          const { id: _id, campanhaId: _campaign, ...draft } = item;
          await campaignContentRepository.adicionarPista({ ...draft, campanhaId: created.id });
          report.pistas += 1;
        }

        for (const item of inCampaign(snapshot.loreEntries, localCampaign.id)) {
          const { id: _id, campanhaId: _campaign, ...draft } = item;
          await campaignContentRepository.adicionarLore({ ...draft, campanhaId: created.id });
          report.lore += 1;
        }

        for (const item of inCampaign(snapshot.anotacoes, localCampaign.id)) {
          await campaignContentRepository.adicionarAnotacao(created.id, item.titulo, item.conteudo);
          report.anotacoes += 1;
        }

        for (const item of inCampaign(snapshot.cenas, localCampaign.id)) {
          const { id: _id, campanhaId: _campaign, ...draft } = item;
          await campaignContentRepository.adicionarCena({ ...draft, campanhaId: created.id });
          report.cenas += 1;
        }

        for (const item of inCampaign(snapshot.handouts, localCampaign.id)) {
          const { id: _id, campanhaId: _campaign, storagePath: _storage, ...draft } = item;
          await campaignContentRepository.adicionarHandout({
            ...draft,
            campanhaId: created.id,
            storagePath: undefined
          });
          report.handouts += 1;
        }

        for (const item of inCampaign(snapshot.contadores, localCampaign.id)) {
          const { id: _id, criadoEm: _created, atualizadoEm: _updated, campanhaId: _campaign, sessaoId: _session, cenaId: _scene, ...draft } = item;
          await liveTableRepository.addCounter({
            ...draft,
            campanhaId: created.id,
            sessaoId: undefined,
            cenaId: undefined
          });
          report.contadores += 1;
        }

        const mapIdMap = new Map<string, string>();
        for (const item of inCampaign(snapshot.mapas, localCampaign.id)) {
          const { id: oldMapId, criadoEm: _created, atualizadoEm: _updated, campanhaId: _campaign, storagePath: _storage, ...draft } = item;
          const migrated = await liveTableRepository.addMap({
            ...draft,
            campanhaId: created.id,
            storagePath: undefined
          });
          mapIdMap.set(oldMapId, migrated.id);
          report.mapas += 1;
        }

        for (const item of inCampaign(snapshot.tokensMapa, localCampaign.id)) {
          const mappedMapId = mapIdMap.get(item.mapaId);
          if (!mappedMapId) continue;
          const { id: _id, criadoEm: _created, atualizadoEm: _updated, campanhaId: _campaign, mapaId: _map, ...draft } = item;
          await liveTableRepository.addToken({
            ...draft,
            campanhaId: created.id,
            mapaId: mappedMapId
          });
          report.tokens += 1;
        }
      } catch (error) {
        await campaignRepository.remover(created.id).catch(() => undefined);
        campaignMap.delete(localCampaign.id);
        throw error;
      }
    }

    onProgress?.('Sincronizando fichas…');
    for (const character of snapshot.personagens) {
      const mappedCampaignId = character.campaignId
        ? campaignMap.get(character.campaignId)
        : undefined;

      try {
        await characterRepository.salvar({
          ...character,
          campaignId: mappedCampaignId,
          ownerUserId: userId,
          atualizadoEm: new Date().toISOString()
        });
        report.personagens += 1;
      } catch (error: any) {
        // Uma ficha já existente e vinculada a outra campanha não deve abortar toda a migração.
        if (!String(error?.message || '').toLowerCase().includes('duplicate')) {
          throw error;
        }
      }
    }

    onProgress?.('Sincronização concluída.');
    return report;
  }
};
