import { useAirdropStore } from '@app/store';
import { openTrancheModal } from '@app/store/actions/airdropStoreActions';
import { formatNumber, FormatPreset } from '@app/utils';
import { SidebarItem } from './components/SidebarItem';
import { ActionImgWrapper, GemImg, GemImgLarge, TooltipWrapper } from './items.style';
import gem from '@app/assets/images/gem.png';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { FEATURE_FLAGS } from '@app/store/consts.ts';

export default function Gems() {
    const { t } = useTranslation('airdrop');
    const gemCount = useAirdropStore((s) => s.userPoints?.base?.gems || s.userDetails?.user?.rank?.gems || 0);
    const features = useAirdropStore((s) => s.features);
    const formattedCountCompact = formatNumber(gemCount, FormatPreset.COMPACT);
    const formattedCount = formatNumber(gemCount, FormatPreset.DECIMAL_COMPACT);
    const tooltipContent = (
        <>
            <TooltipWrapper>
                <GemImg src={gem} alt="gem ico" />
                <Typography variant="h6">{formattedCount}</Typography>
            </TooltipWrapper>
            <Typography variant="p">{t('gems')}</Typography>
        </>
    );
    const handleClick = () => {
        openTrancheModal();
    };

    const ctaEnabled = features?.includes(FEATURE_FLAGS.FF_AD_CLAIM_ENABLED);

    return (
        <SidebarItem
            text={formattedCountCompact}
            tooltipContent={tooltipContent}
            onClick={ctaEnabled ? handleClick : undefined}
        >
            <ActionImgWrapper>
                <GemImgLarge src={gem} alt="gem image" />
            </ActionImgWrapper>
        </SidebarItem>
    );
}
