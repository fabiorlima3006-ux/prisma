import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => cleanup());

// jsdom n�o implementa canvas 2D: contexto no-op para componentes que desenham.
// Testes que precisam de null podem usar vi.spyOn(HTMLCanvasElement.prototype, 'getContext').
HTMLCanvasElement.prototype.getContext = function getContext() {
  return {
    clearRect() {},
    fillRect() {},
    setTransform() {},
    fillStyle: '',
    globalAlpha: 1,
  };
} as unknown as HTMLCanvasElement['getContext'];
