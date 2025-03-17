import { useAirdropStore } from '@app/store';
import { formatNumber, FormatPreset } from '@app/utils';
import { SidebarItem } from './components/SidebarItem';
import { ActionImgWrapper, GemImg, GemImgLarge, TooltipWrapper } from './items.style';
import gem from '@app/assets/images/gem.png';
import { Typography } from '@app/components/elements/Typography.tsx';

export default function Gems() {
    const gemCount = useAirdropStore((s) => s.userPoints?.base?.gems || s.userDetails?.user?.rank?.gems || 0);
    const formattedCountCompact = formatNumber(gemCount, FormatPreset.COMPACT);
    const formattedCount = formatNumber(gemCount, FormatPreset.DECIMAL_COMPACT);
    const tooltipContent = (
        <TooltipWrapper>
            <GemImg src={gem} alt="gem ico" />
            <Typography variant="h6">{formattedCount}</Typography>
        </TooltipWrapper>
    );
    return (
        <SidebarItem text={formattedCountCompact} tooltipContent={tooltipContent}>
            <ActionImgWrapper>
                <GemImgLarge src={gem} alt="gem image" />
            </ActionImgWrapper>
        </SidebarItem>
    );
}
