import styled from 'styled-components';

const buttonSize = '14px';
const colors = {
    close: '#ED695E',
    closeDark: '#D24F43',
    minMax: '#F6BD50',
    minMaxDark: '#D8A040',
    maximize: '#61C354',
    maximizeDark: '#51A73E',
    icon: '#000',
};

export const CloseButton = styled.div`
    background-color: ${colors.close};
    border: 1px solid ${colors.closeDark};
    height: ${buttonSize};
    width: ${buttonSize};
    box-shadow: none;
    padding: 0;
    color: ${colors.close};
    '&:hover': {
        background-color: ${colors.close};
        border-color: ${colors.closeDark};
        color: ${colors.icon};
    }
`;

export const TitleBarContainer = styled('div')`
    height: 40px;
    user-select: none;
    pointer-events: auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    //z-index: 1000;
`;

export const MinimizeButton = styled.button`
    background-color: ${colors.minMax};
    border: 1px solid ${colors.minMaxDark};
    height: ${buttonSize};
    width: ${buttonSize};
    box-shadow: none;
    padding: 0;
    color: ${colors.minMax};
    '&:hover': {
        background-color: ${colors.minMax};
        border-color: ${colors.minMaxDark};
        color: ${colors.icon};
    }
`;

export const ToggleButton = styled.button`
    border: 1px solid ${colors.maximizeDark};
    height: ${buttonSize};
    width: ${buttonSize};
    box-shadow: none;
    padding: 0;
    color: ${colors.maximize};
    '&:hover': {
        background-color: ${colors.maximize};
        border-color: ${colors.maximizeDark};
        color: ${colors.icon};
    },
`;
