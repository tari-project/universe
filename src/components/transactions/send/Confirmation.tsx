import styled from 'styled-components';
import * as m from 'motion/react-m';
import { CheckHollowSVG } from '@app/assets/icons/check-hollow.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';

const Wrapper = styled(m.div)`
    width: 100%;
    height: 100%;
    border-radius: 20px;
    background: rgba(57, 136, 8, 0.85);
    backdrop-filter: blur(1px);
    align-items: center;
    justify-content: center;
    display: flex;
    position: absolute;
    flex-direction: column;
    color: ${({ theme }) => theme.colors.greyscale[50]};
`;

const ContentWrapper = styled.div`
    mask: linear-gradient(transparent 10%, black, transparent 90%);
    background: transparent;
    backdrop-filter: blur(3px);
    align-items: center;
    justify-content: center;
    display: flex;
    flex-direction: column;
    padding: 2px 40px;
    gap: 14px;
    width: 100%;
    height: 100%;
    p {
        text-align: center;
        white-space: pre-wrap;
    }
    svg {
        height: 2.8rem;
    }
`;

const variants = {
    hidden: {
        opacity: 0,
    },
    visible: {
        opacity: 1,
    },
};

export function Confirmation() {
    return (
        <Wrapper variants={variants} initial="hidden" animate="visible">
            <ContentWrapper>
                <Typography variant="p">{`Your transaction has been submitted!\nIt will show up in your history after mining a few blocks.`}</Typography>
                <CheckHollowSVG />
            </ContentWrapper>
        </Wrapper>
    );
}
