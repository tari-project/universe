import { invoke } from '@tauri-apps/api/tauri';
import { useEffect } from 'react';
import { useUIStore } from '../store/useUIStore';
import useAppStateStore from '../store/appStateStore';

export const useUserMousePosition = () => {
    const setUserMousePosition = useUIStore((s) => s.setUserMousePosition);
    const setError = useAppStateStore((s) => s.setError);

    useEffect(() => {
        const intervalId = setInterval(() => {
            invoke('check_user_mouse_position')
                .then((response) => {
                    if (response && response.length === 2) {
                        setUserMousePosition(response);
                    } else {
                        console.error(
                            'check_user_mouse_position returned invalid response',
                            response
                        );
                    }
                })
                .catch((e) => {
                    console.error('Could not listen to user inactivity', e);
                    setError(e.toString());
                });
        }, 1000);

        return () => {
            clearInterval(intervalId);
        };
    }, []);
};
