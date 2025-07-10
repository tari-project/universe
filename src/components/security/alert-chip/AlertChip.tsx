import styled from 'styled-components';
import exclamationEmoji from '/assets/img/icons/emoji/exclamation.png';
import { Typography } from '@app/components/elements/Typography.tsx';

interface AlertChipProps {
    text?: string;
}

const Wrapper = styled.div`
    border: 1px solid ${({ theme }) => (theme.mode === 'dark' ? `#623939` : `#FFD1D1`)};
    background-color: ${({ theme }) => (theme.mode === 'dark' ? `#492c2c` : `#FFE8E8`)};
    border-radius: 20px;
    height: 30px;
    gap: 5px;
    padding: 0 12px 0 10px;
    width: max-content;
    display: flex;
    align-items: center;
`;
const IconWrapper = styled.div`
    display: flex;
    height: 18px;
    align-items: center;
    justify-content: center;
    img {
        display: flex;
        max-height: 100%;
    }
`;

const Text = styled(Typography)`
    display: flex;
    font-size: 14px;
    font-weight: 600;
`;

export const AlertChip = ({ text = 'Highly recommended' }: AlertChipProps) => {
    return (
        <Wrapper>
            <IconWrapper>
                <img src={exclamationEmoji} alt={`Exclamation mark emoji`} />
            </IconWrapper>
            <Text variant="p">{text}</Text>
        </Wrapper>
    );
};
