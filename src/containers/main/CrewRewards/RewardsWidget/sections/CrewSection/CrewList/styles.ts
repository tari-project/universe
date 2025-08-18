import styled from 'styled-components';

export const OuterWrapper = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    flex: 1;
    min-height: 0;
    overflow: hidden;
`;

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    position: relative;
`;

export const Inside = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    padding-bottom: 60px;
    position: relative;
`;

export const ListGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 5px;
    width: 100%;
    padding-bottom: 10px;
`;

export const MessageWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;

    padding: 20px;
    border-radius: 15px;
    border: 1px solid rgba(227, 227, 227, 0.03);
    background: rgba(255, 255, 255, 0.04);
`;

export const MessageText = styled.div`
    color: #fff;
    font-family: Poppins, sans-serif;
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: 1.3;
`;

export const MessageButton = styled.button`
    color: #000;
    font-family: Poppins, sans-serif;
    font-size: 12px;
    font-style: normal;
    font-weight: 600;
    line-height: 1.3;

    padding: 6px 20px;
    border-radius: 100px;
    background: #fff;
`;
