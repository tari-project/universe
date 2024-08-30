import { useCallback, useEffect } from 'react';

interface Props {
    keys: KeyboardEvent['key'][];
    callback: () => void;
}
export function useKeyboardEvent({ keys, callback }: Props) {
    const keyDownFn = useCallback(
        (event: KeyboardEvent) => {
            if (keys.includes(event.key)) {
                callback();
            }
        },
        [callback, keys]
    );

    useEffect(() => {
        document.addEventListener('keydown', keyDownFn);
        return () => {
            document.removeEventListener('keydown', keyDownFn);
        };
    }, [keyDownFn]);
}
