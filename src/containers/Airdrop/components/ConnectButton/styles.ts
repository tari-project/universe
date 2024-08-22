import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { FaXTwitter } from 'react-icons/fa6';

export const StyledButton = styled(Button)`
    padding: 10px;
    justify-content: center;
    align-items: center;
    gap: 10px;
    border-radius: 70px;
    border: 1px solid #000;
    display: flex;
    text-transform: none;
    transition: scale 0.2s ease-in-out;
    &:hover {
        scale: 1.01;
    }
`;

export const StyledXIcon = styled(FaXTwitter)`
    fill: #fff;
    height: 12px;
`;
export const StyledXIconWrapper = styled('div')`
    background: #000;
    border-radius: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 28px;
    width: 28px;
`;
