import { StagedSecuritySectionType } from '../../StagedSecurityModal';
import { BlackButton, Text, Title } from '../../styles';
import { WalletText, Warning, Wrapper } from './styles';

interface Props {
    setSection: (section: StagedSecuritySectionType) => void;
}

export default function ProtectIntro({ setSection }: Props) {
    const handleButtonClick = () => {
        setSection('SeedPhrase');
    };

    return (
        <Wrapper>
            <Warning>❗ Highly recommended</Warning>

            <Title>Protect your tokens by backing up your seed phrase</Title>

            <Text>
                Tari Universe automatically sets up a wallet for you when you start mining. Make sure you always have
                access to your wallet by storing your seed phrase in a safe spot.
            </Text>

            <WalletText>Your wallet has 450.2 XTM</WalletText>

            <BlackButton onClick={handleButtonClick}>
                <span>Back up seed phrase</span>
            </BlackButton>
        </Wrapper>
    );
}
