import styled from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    min-width: clamp(500px, 30vw, 620px);
    gap: 6px;
    padding: 0 10px;
`;

export const Form = styled.form`
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 6px;
`;

export const CheckboxWrapper = styled.div`
    display: flex;

    border: 1px solid deeppink;
`;
