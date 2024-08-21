import { useCallback } from 'react';
import { setAnimationState } from '../../visuals';
import { GlAppState } from '@app/glApp';

export function useVisualisation() {
    return useCallback((state: GlAppState) => setAnimationState(state), []);
}
