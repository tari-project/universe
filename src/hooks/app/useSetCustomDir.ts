import { useState, useTransition } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { useConfigCoreStore } from '@app/store/stores/config/useConfigCoreStore.ts';
import { setDirectory } from '@app/store/actions/config/core.ts';

export function useSetCustomDir() {
    const currentDir = useConfigCoreStore((s) => s.node_data_directory);
    const [isPending, startTransition] = useTransition();
    const [selectedDir, setSelectedDir] = useState('');

    const handleClear = () => setSelectedDir('');
    function handleSelect() {
        startTransition(async () => {
            const dir = await open({ multiple: false, directory: true });
            if (dir) setSelectedDir(dir);
        });
    }
    function handleSave() {
        startTransition(async () => {
            await setDirectory({ path: selectedDir }).then(handleClear);
        });
    }

    return {
        loading: isPending,
        selected: selectedDir,
        currentDir,
        handleSelect,
        handleSave,
        handleClear,
    };
}
