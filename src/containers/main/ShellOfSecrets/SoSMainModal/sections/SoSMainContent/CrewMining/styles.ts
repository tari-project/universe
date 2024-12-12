import styled from 'styled-components';

export const Wrapper = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 30px;
`;

export const TopRow = styled('div')`
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
`;

export const LeftSide = styled('div')`
    display: flex;
    align-items: center;
    gap: 17px;
`;

export const SectionTitle = styled('div')`
    color: #fff;
    font-size: 24px;
    font-style: normal;
    font-weight: 700;
    line-height: 129.623%;
    text-transform: uppercase;
`;

export const Divider = styled('span')`
    width: 3px;
    height: 20px;
    background: #fff;
`;

export const Rate = styled('div')`
    color: #e6ff47;
    font-size: 24px;
    font-style: normal;
    font-weight: 700;
    line-height: 129.623%;
    text-transform: uppercase;
`;

export const Mining = styled('div')`
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    line-height: normal;
    text-transform: uppercase;

    display: inline-flex;
    height: 27px;
    padding: 10px 5px 10px 13px;
    justify-content: center;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;

    border-radius: 7px;
    background: rgba(217, 217, 217, 0.1);
`;
