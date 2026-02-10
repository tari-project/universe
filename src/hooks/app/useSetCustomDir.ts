import { useEffect, useState, useTransition } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { useConfigCoreStore } from '@app/store/stores/config/useConfigCoreStore.ts';
import { setDirectory } from '@app/store/actions/config/core.ts';
import { setShowConfirmLocation } from '@app/store/stores/useModalStore.ts';
import { setMoveDataConfirmed, useNodeStore } from '@app/store';

export function useSetCustomDir() {
    const currentDir = useConfigCoreStore((s) => s.node_data_directory);
    const moveDataConfirmed = useNodeStore((s) => s.moveDataConfirmed);
    const [isPending, startTransition] = useTransition();
    const [selectedDir, setSelectedDir] = useState('');

    const handleClear = () => setSelectedDir('');
    function handleSelect() {
        startTransition(async () => {
            const dir = await open({ multiple: false, directory: true });
            if (dir) setSelectedDir(dir);
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
        handleSelect,
        handleSave: () => setShowConfirmLocation(true),
        handleClear,
    };
}
