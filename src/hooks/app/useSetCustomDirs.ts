import { useEffect, useState, useTransition } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { CustomDirectory } from '@app/types/configs.ts';
import { useConfigCoreStore } from '@app/store/stores/config/useConfigCoreStore.ts';
import { setDirectory } from '@app/store/actions/config/core.ts';

interface UseSetCustomDirs {
    type: CustomDirectory;
}
export function useSetCustomDirs({ type }: UseSetCustomDirs) {
    const directories = useConfigCoreStore((s) => s.directories);
    const [isPending, startTransition] = useTransition();
    const [selectedDir, setSelectedDir] = useState('');

    const currentDir = directories?.[type];
    const handleClear = () => setSelectedDir('');

    useEffect(() => {
        console.log(`directories= `, directories);
    }, [directories]);

    function handleSelect() {
        startTransition(async () => {
            const dir = await open({ multiple: false, directory: true });
            if (dir) setSelectedDir(dir);
        });
    }

    function handleSave() {
        startTransition(async () => {
            await setDirectory({ directoryType: CustomDirectory.ChainData, path: selectedDir }).then(handleClear);
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
