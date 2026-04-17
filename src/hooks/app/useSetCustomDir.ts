import { useEffect, useState, useTransition } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { useConfigCoreStore } from '@app/store/stores/config/useConfigCoreStore.ts';
import { setDirectory } from '@app/store/actions/config/core.ts';
import { setShowConfirmLocation } from '@app/store/stores/useModalStore.ts';
import { setMoveDataConfirmed, useNodeStore } from '@app/store';
import { addToast } from '@app/components/ToastStack/useToastStore.tsx';

export function useSetCustomDir() {
    const currentDir = useConfigCoreStore((s) => s.node_data_directory);
    const moveDataConfirmed = useNodeStore((s) => s.moveDataConfirmed);
    const [isPending, startTransition] = useTransition();
    const [selectedDir, setSelectedDir] = useState('');
    const [validationError, setValidationError] = useState<string | null>(null);

    const handleClear = () => {
        setSelectedDir('');
        setValidationError(null);
    };

    function handleSelect() {
        startTransition(async () => {
            const dir = await open({ multiple: false, directory: true });
            if (dir) {
                setSelectedDir(dir);
                setValidationError(null);

                // Validate the path early to catch network mount issues
                try {
                    await invoke('validate_node_data_path', { path: dir });
                } catch (e) {
                    const errorMsg = typeof e === 'string' ? e : String(e);
                    setValidationError(errorMsg);
                    addToast({
                        type: 'error',
                        title: 'Invalid directory',
                        text: errorMsg,
                        timeout: 8000,
                    });
                }
            }
        });
    }

    useEffect(() => {
        if (!moveDataConfirmed || !selectedDir) return;
        startTransition(async () => {
            try {
                await setDirectory({ path: selectedDir });
            } finally {
                setMoveDataConfirmed(false);
                handleClear();
                setShowConfirmLocation(false);
            }
        });
    }, [moveDataConfirmed, selectedDir]);

    return {
        loading: isPending,
        selected: selectedDir,
        currentDir,
        validationError,
        handleSelect,
        handleSave: () => {
            if (validationError) {
                addToast({
                    type: 'error',
                    title: 'Cannot use this directory',
                    text: validationError,
                    timeout: 5000,
                });
                return;
            }
            setShowConfirmLocation(true);
        },
        handleClear,
    };
}
