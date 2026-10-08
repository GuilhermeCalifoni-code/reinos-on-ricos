import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePinchCamera, centerBetween, distanceBetween } from '../src/features/realtime/mapTouchGeometry';

test('pinça amplia mapa mantendo ponto abaixo do centro dos dedos', () => {
  assert.deepEqual(calculatePinchCamera({
    zoom: 1, pan: { x: 0, y: 0 }, startDistance: 100, currentDistance: 200,
    initialCenter: { x: 100, y: 140 }, currentCenter: { x: 100, y: 140 },
    viewportOrigin: { x: 0, y: 0 }
  }), { zoom: 2, pan: { x: -100, y: -140 } });
});

test('pinça simultaneamente aplica zoom e movimento com viewport deslocado', () => {
  assert.deepEqual(calculatePinchCamera({
    zoom: 2, pan: { x: 15, y: -20 }, startDistance: 80, currentDistance: 80,
    initialCenter: { x: 180, y: 210 }, currentCenter: { x: 192, y: 180 },
    viewportOrigin: { x: 100, y: 100 }
  }), { zoom: 2, pan: { x: 27, y: -50 } });
});

test('pinça respeita limites e trata dedos sobrepostos', () => {
  const input = {
    zoom: 1, pan: { x: 0, y: 0 }, initialCenter: { x: 0, y: 0 },
    currentCenter: { x: 0, y: 0 }, viewportOrigin: { x: 0, y: 0 }
  };
  assert.equal(calculatePinchCamera({ ...input, startDistance: 1, currentDistance: 500 }).zoom, 3);
  assert.equal(calculatePinchCamera({ ...input, startDistance: 100, currentDistance: 1 }).zoom, .5);
  assert.equal(calculatePinchCamera({ ...input, startDistance: 0, currentDistance: 0 }).zoom, 1);
  assert.equal(distanceBetween({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
  assert.deepEqual(centerBetween({ x: 2, y: 4 }, { x: 8, y: 12 }), { x: 5, y: 8 });
});
