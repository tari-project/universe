import { Select } from '@app/components/elements/inputs/Select';
import { useMiningStore } from '@app/store/useMiningStore';
import { CpuMiner } from '@app/types/mining';

const options = [
    { label: 'Clythor', value: 'Clythor' },
    { label: 'Xmrig', value: 'Xmrig' },
];

export const RandomXCpuMiner: React.FC = () => {
    const { cpuMiner, setCpuMiner } = useMiningStore((s) => ({ cpuMiner: s.cpuMiner, setCpuMiner: s.setCpuMiner }));

    return <Select options={options} onChange={(miner) => setCpuMiner(miner as CpuMiner)} selectedValue={cpuMiner} />;
};

export default RandomXCpuMiner;
