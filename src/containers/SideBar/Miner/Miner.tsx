import Tile from './components/Tile.tsx';
import { MinerWrapper, TileWrapper } from './styles.ts';
import AutoMiner from './components/AutoMiner.tsx';
import Scheduler from './components/Scheduler.tsx';
import ModeSelect from './components/ModeSelect.tsx';
import { useAppStatusStore } from '../../../store/useAppStatusStore.ts';
import { formatNumber, truncateString } from '../../../utils';
import { useEffect, useState } from 'react';

function Miner() {
	const [currResource, setCurrResource] = useState<"CPU" | "GPU">("CPU");
    const {cpu, gpu_brand} = useAppStatusStore((s) => s);
    const {
        cpu_usage,
        cpu_brand = '',
        hash_rate,
        estimated_earnings = 0,
    } = cpu || {};

	useEffect(() => {
		const resourceSwitcher = setInterval(() => {
		setCurrResource((prev) => (prev === "CPU" ? "GPU" : "CPU"));
		}, 5_000);

		return () => {
		clearInterval(resourceSwitcher);
		};
	}, []);

  	const resourceBrand = (currResource === "CPU" ? cpu_brand : gpu_brand) || "";

    return (
        <MinerWrapper>
            <AutoMiner />
            <Scheduler />
            <TileWrapper>
                <Tile title="Resources" stats="CPU" />
                <ModeSelect />
                <Tile title="Hashrate (to remove)" stats={hash_rate + ' H/s'} />
                <Tile title="CPU Utilization" stats={cpu_usage + '%'} />
                <Tile title={currResource} stats={truncateString(resourceBrand, 10)} />
                <Tile
                    title="Est Earnings"
                    stats={
                        formatNumber(estimated_earnings / 1000000) + ' XTM/24h'
                    }
                />
            </TileWrapper>
        </MinerWrapper>
    );
}

export default Miner;

