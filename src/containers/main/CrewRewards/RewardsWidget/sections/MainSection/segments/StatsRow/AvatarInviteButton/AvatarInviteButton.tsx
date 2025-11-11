import { useCopyToClipboard } from '@app/hooks/helpers';
import { Copied, Wrapper } from './styles';
import { useAirdropStore } from '@app/store';
import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

export default function AvatarInviteButton() {
    const { t } = useTranslation();
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    const airdropUrl = useAirdropStore((state) => state.backendInMemoryConfig?.airdrop_url || '');
    const referralCode = useAirdropStore((state) => state.userDetails?.user?.referral_code || '');

    const handleInviteButtonClick = () => {
        if (referralCode && airdropUrl && !isCopied) {
            copyToClipboard(`${airdropUrl}/download/${referralCode}`);
        }
    };

    return (
        <Wrapper onClick={handleInviteButtonClick}>
            <AnimatePresence>
                {isCopied && (
                    <Copied
                        initial={{ opacity: 0, y: 0, x: '-50%' }}
                        animate={{ opacity: 1, y: -4, x: '-50%' }}
                        exit={{ opacity: 0, x: '-50%' }}
                    >
                        {t('airdrop:crewRewards.copied')}
                    </Copied>
                )}
            </AnimatePresence>
            +
        </Wrapper>
    );
}
