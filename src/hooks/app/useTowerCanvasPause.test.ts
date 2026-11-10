import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTowerCanvasPause } from './useTowerCanvasPause.ts';
import { TOWER_CANVAS_ID } from '@app/store/types/ui.ts';

describe('useTowerCanvasPause', () => {
    let canvas: HTMLCanvasElement;

    beforeEach(() => {
        canvas = document.createElement('canvas');
        canvas.id = TOWER_CANVAS_ID;
        document.body.appendChild(canvas);
    });

    afterEach(() => {
        canvas.remove();
    });

    it('removes canvas id attribute when shouldPause is true', () => {
        const { rerender } = renderHook(({ shouldPause }) => useTowerCanvasPause(shouldPause), {
            initialProps: { shouldPause: false },
        });

        expect(canvas.id).toBe(TOWER_CANVAS_ID);

        rerender({ shouldPause: true });

        expect(canvas.hasAttribute('id')).toBe(false);
        expect(canvas.id).toBe('');
        expect(document.getElementById(TOWER_CANVAS_ID)).toBeNull();
        expect(document.querySelector('canvas:not([id])')).toBe(canvas);
    });

    it('restores canvas id to tower-canvas when shouldPause becomes false', () => {
        const { rerender } = renderHook(({ shouldPause }) => useTowerCanvasPause(shouldPause), {
            initialProps: { shouldPause: true },
        });

        expect(canvas.hasAttribute('id')).toBe(false);

        rerender({ shouldPause: false });

        expect(canvas.id).toBe(TOWER_CANVAS_ID);
        expect(document.getElementById(TOWER_CANVAS_ID)).toBe(canvas);
    });

    it('restores original id on unmount', () => {
        const { unmount } = renderHook(() => useTowerCanvasPause(true));

        expect(canvas.hasAttribute('id')).toBe(false);

        unmount();

        expect(canvas.id).toBe(TOWER_CANVAS_ID);
        expect(document.getElementById(TOWER_CANVAS_ID)).toBe(canvas);
    });

    it('stops Three.js render loop guard when canvas id is removed and resumes on restoration', () => {
        const renderer = {
            domElement: canvas,
            renderCalls: 0,
            render() {
                this.renderCalls++;
            },
        };
        function tick() {
            if (!document.getElementById(renderer?.domElement?.id)) return;
            renderer.render();
        }

        tick();
        expect(renderer.renderCalls).toBe(1);

        const { rerender } = renderHook(({ shouldPause }) => useTowerCanvasPause(shouldPause), {
            initialProps: { shouldPause: false },
        });

        tick();
        expect(renderer.renderCalls).toBe(2);

        // Pause: canvas id is removed, so renderer.domElement.id is '', document.getElementById('') is null
        rerender({ shouldPause: true });

        tick();
        expect(renderer.renderCalls).toBe(2);

        // Resume: canvas id is restored to TOWER_CANVAS_ID, render loop continues
        rerender({ shouldPause: false });

        tick();
        expect(renderer.renderCalls).toBe(3);
    });
});
