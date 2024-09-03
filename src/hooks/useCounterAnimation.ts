import { useEffect, useState } from 'react';
import { animate } from 'framer-motion';

export default function useCounterAnimation(maxValue: number, initialValue = 0, duration = 1) {
    const [counter, setCounter] = useState<number>(initialValue);

    useEffect(() => {
        const controls = animate(initialValue, maxValue, {
            duration,
            onUpdate(value) {
                setCounter(value);
            },
        });
        return () => controls.stop();
    }, [initialValue, maxValue, duration]);

    return counter;
}
