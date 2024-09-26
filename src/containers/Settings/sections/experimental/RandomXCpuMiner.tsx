import { Select } from '@app/components/elements/inputs/Select';
import { useMiningStore } from '@app/store/useMiningStore';
import { CpuMiner } from '@app/types/mining';
import { TileItem } from '@app/containers/SideBar/Miner/styles';
import { Typography } from '@app/components/elements/Typography';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { useAppStateStore } from '@app/store/appStateStore';

const options = [
    { label: 'Clythor', value: 'Clythor' },
    { label: 'Xmrig', value: 'Xmrig' },
];

export const RandomXCpuMiner: React.FC = () => {
    const { cpuMiner, setCpuMiner } = useMiningStore((s) => ({ cpuMiner: s.cpuMiner, setCpuMiner: s.setCpuMiner }));
    const { t } = useTranslation('settings', { useSuspense: false });
    const isSettingUp = useAppStateStore(useShallow((s) => s.isSettingUp));

    const isMiningControlsEnabled = useMiningStore(useShallow((s) => s.miningControlsEnabled));
    const isChangingMode = useMiningStore((s) => s.isChangingMode);

    const isCPUMining = useMiningStore((s) => s.cpu.mining.is_mining);
    const isGPUMining = useMiningStore((s) => s.gpu.mining.is_mining);
    const isMiningInitiated = useMiningStore((s) => s.miningInitiated);
    const isMining = isCPUMining || isGPUMining;
    const isMiningLoading = (isMining && !isMiningInitiated) || (isMiningInitiated && !isMining);

    return (
        <TileItem layoutId="miner-mode-select-tile" layout>
            <Typography>{t('randomX-miner')}</Typography>
            <Select
                disabled={isMiningLoading || isChangingMode || isSettingUp || !isMiningControlsEnabled}
                loading={isChangingMode}
                options={options}
                onChange={(miner) => setCpuMiner(miner as CpuMiner)}
                selectedValue={cpuMiner}
            />
        </TileItem>
    );
};

export default RandomXCpuMiner;
