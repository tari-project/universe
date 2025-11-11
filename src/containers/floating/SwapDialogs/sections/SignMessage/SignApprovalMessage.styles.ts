import styled from 'styled-components';

export const HeaderWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 15px;

    h3 {
        font-family: Poppins;
        font-weight: 600;
        font-size: 21px;
        line-height: 31px;
        letter-spacing: 0%;
        text-align: center;
        color: ${({ theme }) => theme.palette.text.primary};
        max-width: 300px;
        margin: 0;
    }

    p {
        font-family: Poppins;
        font-weight: 500;
        font-size: 14px;
        line-height: 18px;
        letter-spacing: 0.46px;
        text-align: center;
        color: ${({ theme }) => theme.palette.text.secondary};
        max-width: 420px;
        margin: 0;
    }
`;

export const StatusWrapper = styled.div`
    margin: 20px auto;
    width: fit-content;
    background: ${({ theme }) => theme.palette.background.paper};
    border-radius: 60px;
    padding: 10px 20px;
    gap: 15px;

    display: flex;
    align-items: center;

    font-family: Poppins;
    font-weight: 500;
    font-size: 14px;
    color: ${({ theme }) => theme.palette.text.primary};
`;
