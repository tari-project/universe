import { useAirdropStore } from '@app/store';
import { formatNumber, FormatPreset } from '@app/utils';
import { SidebarItem } from './components/SidebarItem';
import { ActionImgWrapper, GemImg } from './items.style';
import gem from '@app/assets/images/gem.png';

export default function Gems() {
    const gemCount = useAirdropStore((s) => s.userPoints?.base?.gems || 0);
    const formattedCount = formatNumber(gemCount, FormatPreset.COMPACT);
    return (
        <SidebarItem text={formattedCount}>
            <ActionImgWrapper>
                <GemImg src={gem} alt="gem image" />
            </ActionImgWrapper>
        </SidebarItem>
    );
}
