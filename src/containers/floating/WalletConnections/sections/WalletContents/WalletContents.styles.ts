import styled, { keyframes } from 'styled-components';

// Existing styles (ConnectedWalletWrapper, StatusWrapper, ActiveDot might need minor tweaks if any)
export const ConnectedWalletWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 15px 10px 12px;
    border-radius: 60px;
    background: #ffffff40; // As per image on a darker backdrop
`;

export const StatusWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    /* WalletAddress styling is expected to come from WalletConnections.style.ts or be a styled div */
    /* It should be dark text to be visible on the light background of ConnectedWalletWrapper */
`;

const pulse = keyframes`
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
`;

export const ActiveDot = styled.div`
    width: 9px;
    height: 8px;
    border-radius: 100%;
    background: rgba(26, 134, 80, 1); // Green dot
    animation: ${pulse} 2s infinite;
`;

export const WalletContentsContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px; // Increased gap for better separation like in image
    padding: 5px; // Small padding if modal doesn't provide enough
`;

// --- New Styles for Token List & Continue Button ---

export const TokenList = styled.div`
    background: #ffffff;
    border-radius: 16px; // Rounded corners for the list container
    padding: 8px 0; // Vertical padding inside the list; horizontal padding will be on items
    display: flex;
    flex-direction: column;
    box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.05); // Subtle shadow
`;

export const TokenItem = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px; // Padding for each item
    cursor: pointer;
    transition: background-color 0.15s ease-in-out;

    &:hover {
        background-color: #f7f7f7; // Slight hover effect
    }
`;

export const TokenItemLeft = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
`;

export const TokenIconWrapper = styled.div`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden; // Clip image if not perfectly round
`;

export const TokenInfo = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
`;

export const TokenName = styled.span`
    font-family: 'Poppins', sans-serif; // Assuming Poppins from other styles
    font-weight: 600;
    font-size: 16px;
    color: #1c1c1e; // Dark color for text
    line-height: 1.3;
`;

export const TokenSymbol = styled.span`
    font-family: 'Poppins', sans-serif;
    font-weight: 500;
    font-size: 13px;
    color: #8e8e93; // Lighter grey for symbol
    line-height: 1.3;
    text-transform: uppercase;
`;

export const TokenItemRight = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
`;

export const TokenSeparator = styled.hr`
    border: none;
    height: 1px;
    background-color: #eaeaea; // Light grey separator line
    margin: 0 20px; // Align with TokenItem's horizontal padding
`;

export const ContinueButton = styled.button`
    text-align: center;
    background-color: #1a1a2e; // Dark blue/black from image
    color: white;
    font-family: 'Poppins', sans-serif;
    font-weight: 600;
    font-size: 16px;
    padding: 14px 20px;
    border: none;
    border-radius: 50px;
    width: 100%;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out;

    &:hover {
        background-color: #2c2c4d; // Slightly lighter on hover
    }

    &:active {
        background-color: #10101c;
    }
`;
