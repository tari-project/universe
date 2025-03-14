import styled from 'styled-components';

export const Wrapper = styled.div`
    flex-direction: column;
    display: flex;
    gap: 15px;
`;

export const ActionImgWrapper = styled.div`
    align-items: center;
    flex-direction: column;
    img {
        max-width: 100%;
    }
`;
export const GemImg = styled.img`
    width: 30px;
    transform: scaleX(-1);
`;

export const Avatar = styled.div`
    width: 36px;
    height: 36px;
    border-radius: 50%;
    flex-shrink: 0;
`;
