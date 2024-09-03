import { useCallback, useEffect, useRef } from 'react';

export function useClickOutside<T extends HTMLDivElement = HTMLDivElement>(
    callback: (props?: unknown) => void,
    isNested = false
) {
    const ref = useRef<T | null>(null);
    //TODO - come back and check this logic for nested items
    const onClick = useCallback(
        (e) => {
            if (isNested) {
                e.stopImmediatePropagation();
            }
            if (ref.current && !ref.current.contains(e.target)) {
                callback();
            }
        },
        [callback, isNested]
    );

    useEffect(() => {
        document.addEventListener('click', onClick, !isNested);
        return () => {
            document.removeEventListener('click', onClick, !isNested);
        };
    }, [isNested, onClick]);

    return ref;
}
