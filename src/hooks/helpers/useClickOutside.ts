import { useCallback, useEffect, useRef } from 'react';

export function useClickOutside<T extends HTMLDivElement = HTMLDivElement>(
    callback: (props?: unknown) => void,
    isOpen?: boolean,
    isNested = false
) {
    const ref = useRef<T | null>(null);
    //TODO - come back and check this logic for nested items
    const onClick = useCallback(
        (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                if (isOpen && isNested) {
                    e.stopImmediatePropagation();
                }
                callback();
            }
        },
        [callback, isNested, isOpen]
    );

    useEffect(() => {
        document.addEventListener('click', onClick, true);
        return () => {
            document.removeEventListener('click', onClick, true);
        };
    }, [isOpen, onClick]);

    return ref;
}
