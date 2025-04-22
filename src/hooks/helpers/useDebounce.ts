import { useEffect, useRef, useState } from 'react';

export default function useDebouncedValue(initialValue, delay = 250) {
    const [value, setValue] = useState(initialValue);
    const timeoutRef = useRef<NodeJS.Timeout>();

    function cleanup() {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    }

    useEffect(() => {
        timeoutRef.current = setTimeout(() => setValue(initialValue), delay);
        return () => cleanup();
    }, [initialValue, delay]);

    return value;
}
