import styled from 'styled-components';

export const Wrapper = styled.div`
    position: fixed;
    bottom: 40px;
    right: 40px;
    z-index: 2;

    border-radius: 50px;
    background: #000;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5px;
    height: 20px;
    padding: 0px 10px;
    color: #fff;
    font-size: 11px;
    font-style: normal;
    font-weight: 600;
    line-height: 245.455%;

    span {
        opacity: 0.6;
    }
`;
