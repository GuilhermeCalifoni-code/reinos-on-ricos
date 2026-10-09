import type { Personagem } from '../../types/character';
import type { CharacterResourceUpdate } from '../../features/realtime/liveTableRepository';

/**
 * Atualização recebida do Realtime: só altera o cache React.
 * NUNCA deve chamar characterRepository.salvar, pois isso geraria um novo
 * evento e um ciclo de escrita/assinatura entre Mestre e Jogador.
 */
export function applyLiveCharacterResources(
  characters: Personagem[],
  update: CharacterResourceUpdate
): Personagem[] {
  let changed = false;
  const next = characters.map(character => {
    if (character.id !== update.id) return character;
    if (character.vidaAtual === update.vidaAtual &&
        character.focoAtual === update.focoAtual &&
        character.ruptura === update.ruptura &&
        character.protecaoOniricaAtual === update.protecaoOniricaAtual) return character;
    changed = true;
    return {
      ...character,
      vidaAtual: update.vidaAtual,
      focoAtual: update.focoAtual,
      ruptura: update.ruptura,
      protecaoOniricaAtual: update.protecaoOniricaAtual,
      atualizadoEm: update.updatedAt
    };
  });
  return changed ? next : characters;
}
