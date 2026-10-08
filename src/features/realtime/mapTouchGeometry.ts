/** Geometria das interações de zoom da Mesa Ao Vivo.
 * Pan e zoom são expressos em pixels CSS relativos ao viewport.
 * Não depende de DOM e pode ser validada por testes automatizados.
 */
export type Point2D = { x: number; y: number };

export const distanceBetween = (a: Point2D, b: Point2D) =>
  Math.hypot(a.x - b.x, a.y - b.y);

export const centerBetween = (a: Point2D, b: Point2D): Point2D => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2
});

const limit = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

/** Faz zoom ao redor dos dedos, preservando a posição do conteúdo sob eles. */
export function calculatePinchCamera(input: {
  zoom: number;
  pan: Point2D;
  startDistance: number;
  currentDistance: number;
  initialCenter: Point2D;
  currentCenter: Point2D;
  viewportOrigin: Point2D;
  minZoom?: number;
  maxZoom?: number;
}): { zoom: number; pan: Point2D } {
  const {
    zoom, pan, startDistance, currentDistance,
    initialCenter, currentCenter, viewportOrigin,
    minZoom = 0.5, maxZoom = 3
  } = input;
  const nextZoom = limit(
    zoom * (startDistance > 0 ? currentDistance / startDistance : 1),
    minZoom, maxZoom
  );
  const ratio = nextZoom / zoom;
  const localStartX = initialCenter.x - viewportOrigin.x;
  const localStartY = initialCenter.y - viewportOrigin.y;
  return {
    zoom: nextZoom,
    pan: {
      x: currentCenter.x - viewportOrigin.x - (localStartX - pan.x) * ratio,
      y: currentCenter.y - viewportOrigin.y - (localStartY - pan.y) * ratio
    }
  };
}
