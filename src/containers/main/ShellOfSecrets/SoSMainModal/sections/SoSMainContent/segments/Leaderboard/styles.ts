import styled from 'styled-components';

export const Wrapper = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 25px;
`;

export const TopRow = styled('div')`
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

export const SectionTitle = styled('div')`
    color: #fff;
    font-size: 22px;
    font-weight: 700;
    line-height: 129.623%;
    text-transform: uppercase;
`;

export const Button = styled('div')`
    color: #fff;
    font-size: 15px;
    font-weight: 700;
    line-height: normal;
    text-transform: uppercase;

    border-radius: 9px;
    background: rgba(217, 217, 217, 0.1);

    height: 35px;
    padding: 12px 16px;

    display: flex;
    align-items: center;
    justify-content: center;

    cursor: pointer;

    transition: background 0.3s ease;

    &:hover {
        background: rgba(255, 255, 255, 0.2);
    }
`;
