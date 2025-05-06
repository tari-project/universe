import { useEffect, useRef } from 'react';

export function useInterval(callback: () => void, delay: number | null) {
    const storedCb = useRef(callback);
    useEffect(() => {
        storedCb.current = callback;
    }, [callback]);

    useEffect(() => {
        function fn() {
            storedCb.current?.();
        }
        if (delay !== null) {
            const id = setInterval(fn, delay);
            return () => clearInterval(id);
        }
    }, [delay]);
}
