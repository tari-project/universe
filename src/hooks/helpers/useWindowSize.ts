import { useEffect, useRef } from 'react';

export default function useWindowSize() {
    const windowSize = useRef({ width: window.innerWidth, height: window.innerHeight });
    useEffect(() => {
        function handleResize() {
            windowSize.current = {
                width: window.innerWidth,
                height: window.innerHeight,
            };
        }
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);
    return windowSize.current;
}
