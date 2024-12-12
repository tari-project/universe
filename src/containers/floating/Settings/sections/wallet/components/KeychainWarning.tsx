import styled from 'styled-components';
import { Trans } from 'react-i18next';
import { PiWarning } from 'react-icons/pi';
import { Typography } from '@app/components/elements/Typography.tsx';
import { addToast } from '@app/components/ToastStack/useToastStore.tsx';

const Wrapper = styled.div`
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    background-color: ${({ theme }) => theme.palette.warning.light};
    color: ${({ theme }) => theme.palette.warning.dark};
    padding: 8px 14px;
    display: flex;
    flex-direction: row;
    white-space: pre-wrap;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    h6 {
        line-height: 1.3;
    }

    span {
        font-weight: 700;
        cursor: pointer;
    }
`;

export const KeychainWarning = () => {
    function handleKeychain() {
        addToast({
            title: 'Add to keychain',
            text: 'BE stuff should happen now',
        });
    }
    return (
        <Wrapper>
            <PiWarning size={38} />
            <Typography variant="h6">
                <Trans
                    i18nKey="wallet:keychain-access-copy"
                    components={{
                        span: <span onClick={handleKeychain} />,
                    }}
                />
            </Typography>
        </Wrapper>
    );
};
