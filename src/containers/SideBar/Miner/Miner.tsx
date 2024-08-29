import Tile from './components/Tile.tsx';
import { MinerContainer, TileContainer } from './styles.ts';
import AutoMiner from './components/AutoMiner/AutoMiner.tsx';

import ModeSelect from './components/ModeSelect.tsx';
import { useHardwareStatus } from '../../../hooks/useHardwareStatus.ts';
import { Box, Divider, Fade, Grow, Slide, Stack } from '@mui/material';

import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';
import { useMiningControls } from '@app/hooks/mining/useMiningControls.ts';
import { formatNumber } from '@app/utils/formatNumber.ts';
import { useRef } from 'react';
import { TransitionGroup } from 'react-transition-group';
import { useTranslation } from 'react-i18next';

function Miner() {
    const { t } = useTranslation('common', { useSuspense: false });

    const { cpu: cpuHardwareStatus } = useHardwareStatus();
    const { isWaitingForHashRate, isMiningEnabled, isChangingMode } = useMiningControls();

    const hash_rate = useCPUStatusStore((s) => s.hash_rate);
    const estimated_earnings = useCPUStatusStore((s) => s.estimated_earnings);

    const hardwareValSplit = cpuHardwareStatus?.label?.split(' ');
    const hardwareVal = hardwareValSplit?.[0] + ' ' + hardwareValSplit?.[1];

    const hashRateOver1k = hash_rate > 1000; // TODO: add proper generic number format helper
    const hashRateVal = hashRateOver1k ? hash_rate / 1000 : hash_rate;
    const hashRateStr = hashRateVal
        .toLocaleString(undefined, {
            maximumFractionDigits: 2,
        })
        .replace(/,/g, '.');

    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <MinerContainer>
            <TransitionGroup>
                <AutoMiner />
                <Divider sx={{ my: 2 }} />
                <TileContainer>
                    <ModeSelect />
                    <Tile
                        title="Hashrate (H/s)"
                        stats={`${hashRateStr}${hashRateOver1k ? 'k' : ''}`}
                        isLoading={isWaitingForHashRate}
                    />
                    <Tile title="CHIP/GPU" stats={hardwareVal || 'Unknown'} />
                    <Tile
                        title="Est tXTM/day"
                        stats={formatNumber(estimated_earnings / 1000000)}
                        isLoading={isWaitingForHashRate}
                    />
                </TileContainer>
                <Stack ref={containerRef} my={0.6}>
                    <Slide
                        direction="up"
                        in={isMiningEnabled || isChangingMode}
                        container={containerRef.current}
                        timeout={450}
                    >
                        <Box>
                            <Fade in={isMiningEnabled || isChangingMode} timeout={450}>
                                <TileContainer sx={{ zIndex: -199 }}>
                                    <Tile
                                        title="CPU Utilization"
                                        stats={
                                            (cpuHardwareStatus?.usage_percentage || 0).toLocaleString(undefined, {
                                                maximumFractionDigits: 0,
                                            }) + '%'
                                        }
                                    />
                                    <Tile
                                        title="CPU Temperature"
                                        stats={`${cpuHardwareStatus?.current_temperature || 0}°C`}
                                    />
                                </TileContainer>
                            </Fade>
                        </Box>
                    </Slide>
                </Stack>
            </TransitionGroup>
        </MinerContainer>
    );
}

export default Miner;
