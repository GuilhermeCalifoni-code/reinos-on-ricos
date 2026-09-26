import { NewSessionEvent } from '../../types/sessionEvent';

export const sessionEventFactories = {
  rupture: (characterId: string, name: string, delta: number, reason: string): NewSessionEvent => ({ type: 'rupture', characterId, content: `${name}: Ruptura ${delta >= 0 ? '+' : ''}${delta}. ${reason}`, metadata: { delta, reason } }),
  damage: (characterId: string, name: string, delta: number): NewSessionEvent => ({ type: 'damage', characterId, content: `${name}: ${delta < 0 ? 'sofreu' : 'recuperou'} ${Math.abs(delta)} de Vida.`, metadata: { delta } }),
  condition: (characterId: string, name: string, condition: string): NewSessionEvent => ({ type: 'condition', characterId, content: `${name}: condição ${condition}.`, metadata: { condition } }),
  counter: (counterId: string, name: string, value: number, maximum: number): NewSessionEvent => ({ type: 'counter_update', content: `${name}: ${value}/${maximum}.`, metadata: { counterId, value, maximum } }),
  scene: (content: string): NewSessionEvent => ({ type: 'scene_change', content: `A cena mudou para ${content}.`, metadata: { content } }),
  clue: (title: string): NewSessionEvent => ({ type: 'clue_reveal', content: `Pista revelada: ${title}.`, metadata: { title } }),
  map: (content: string): NewSessionEvent => ({ type: 'map_event', content, metadata: {} })
};
