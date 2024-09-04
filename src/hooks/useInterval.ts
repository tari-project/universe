import { useEffect, useLayoutEffect, useRef } from 'react';

export function useInterval(callback: () => void, delay: number | null) {
    const storedCb = useRef(callback);
    useEffect(() => {
        storedCb.current = callback;
    }, [callback]);

    useLayoutEffect(() => {
        function fn() {
            storedCb.current?.();
        }
        if (delay !== null) {
            const id = setInterval(fn, delay);
            return () => clearInterval(id);
        }
    }, [delay]);
}
