import { useCallback, useEffect, useRef } from 'react';

export function useClickOutside<T extends HTMLDivElement = HTMLDivElement>(callback: (props?: unknown) => void) {
    const ref = useRef<T | null>(null);

    const onClick = useCallback(
        (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                callback();
            }
        },
        [callback]
    );

    useEffect(() => {
        document.addEventListener('click', onClick, true);
        return () => {
            document.removeEventListener('click', onClick, true);
        };
    }, [onClick]);

    return ref;
}
