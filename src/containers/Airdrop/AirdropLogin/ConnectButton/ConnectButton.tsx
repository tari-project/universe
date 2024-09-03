import { NumberPill, StyledButton, XIcon, IconCircle, Text, Gem1, Gem2, Gem3 } from './styles.ts';
import gem1Image from './images/gem-1.png';
import gem2Image from './images/gem-2.png';
import gem3Image from './images/gem-3.png';
import { useTranslation } from 'react-i18next';
import useAirdropConnect from '../../hooks/useAirdropConnect.ts';

export default function ConnectButton() {
    const { handleAuth } = useAirdropConnect();

    const { t } = useTranslation(['airdrop'], { useSuspense: false });

    return (
        <StyledButton onClick={handleAuth} size="medium">
            <Gem1 src={gem1Image} alt="" className="ConnectButton-Gem1" />
            <Gem2 src={gem2Image} alt="" className="ConnectButton-Gem2" />
            <Gem3 src={gem3Image} alt="" className="ConnectButton-Gem3" />

            <NumberPill>+200</NumberPill>

            <Text>{t('loginButton')}</Text>

            <IconCircle>
                <XIcon />
            </IconCircle>
        </StyledButton>
    );
}
