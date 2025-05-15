import styled, { css } from 'styled-components';

// --- Existing Styles ---

export const SelectedChain = styled.div`
    margin-top: 20px;
    display: flex;
    padding: 10px 16px;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.5);
`;

export const SelectedChainInfo = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: center;
    flex-direction: column;

    .chain {
        font-family: Poppins, sans-serif;
        font-weight: 600;
        font-size: 10px;
        line-height: 100%;
        letter-spacing: 0%;
        color: #7f7e7d;
    }

    .address {
        font-family: Poppins, sans-serif;
        font-weight: 600;
        font-size: 13px;
        line-height: 100%;
        letter-spacing: 0%;
        text-align: center;
    }
`;

export const SwapOption = styled.div`
    width: 100%;
    margin-top: 5px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 20px;

    > span {
        color: #7f7e7d;
        font-size: 10px;
    }
`;

export const SwapOptionAmount = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;

    color: black;
    font-family: Poppins, sans-serif;
    font-weight: 500;
    font-size: 36px;
`;

export const SwapOptionCurrency = styled.div<{ $clickable?: boolean }>`
    border-radius: 60px;
    gap: 6px;
    padding: 3px;
    padding-right: 10px;
    background: #dcd8d7;
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
    border: 1px solid #0000004d;
    span {
        color: black;
        font-family: Alliance No.1;
        font-weight: 700;
        font-size: 12.85px;
        line-height: 100%;
        letter-spacing: -2%;
    }

    ${({ $clickable }) =>
        $clickable &&
        css`
            cursor: pointer;
            &:hover {
                opacity: 0.8;
            }
        `}
`;

export const SwapDirection = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 1px;
    z-index: 2;
`;

export const SwapAmountInput = styled.input<{ $error?: boolean }>`
    color: black;
    font-family: Poppins, sans-serif;
    font-weight: 500;
    font-size: 28px;
    line-height: 100%;
    width: 100%;
    background: transparent;
    border: none;
    text-align: left;
    padding: 0;
    margin-right: 10px;

    &:focus {
        outline: none;
    }

    &::placeholder {
        color: #aaaaaa;
    }

    ${({ $error }) =>
        $error &&
        css`
            color: #d32f2f;
        `}
`;

export const SwapDirectionWrapper = styled.div<{ $direction: 'input' | 'output' }>`
    display: flex;
    align-items: center;
    justify-content: center;

    cursor: pointer; // Make it look clickable
    transition: background-color 0.2s ease; // Add hover effect

    &:hover {
        background-color: #333; // Darken slightly on hover
    }

    svg {
        transition: transform 0.2s ease-in-out;
    }

    width: 46px;
    height: 46px;
    top: 96px;
    left: 130px;
    border-radius: 23px;
    border-width: 4px;
    background: #090719;

    ${({ $direction }) =>
        $direction === 'output' && // Only rotate when output is the input field now (direction='output')
        css`
            svg {
                transform: rotate(180deg);
            }
        `}
`;

export const TokenSelectButton = styled.button`
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    display: inline-flex; // Ensures it wraps its content
    align-items: center;
    border-radius: 60px; // Match SwapOptionCurrency if desired for hover/focus states
    transition: background-color 0.15s ease;

    &:hover ${SwapOptionCurrency} {
        // Style the inner div on button hover
        background: #dcd8d7; // Slightly darker background on hover
    }

    &:focus {
        outline: 2px solid lightblue; // Accessibility focus ring
        outline-offset: 2px;
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
        ${SwapOptionCurrency} {
            // Make currency look disabled too
            background: #f0f0f0;
        }
    }
`;

// Full-screen overlay for the modal
export const SelectorModalOverlay = styled.div`
    position: fixed;
    inset: 0; // Equivalent to top: 0; left: 0; right: 0; bottom: 0;
    background-color: rgba(0, 0, 0, 0.6); // Semi-transparent black background
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000; // Ensure it appears above other content
    backdrop-filter: blur(4px); // Optional nice blur effect
`;

// The content container within the modal overlay
export const SelectorModalContent = styled.div`
    background-color: #ffffff; // White background
    padding: 25px;
    border-radius: 16px; // More rounded corners
    min-width: 320px; // Minimum width
    max-width: 400px; // Maximum width
    width: 90%; // Responsive width
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15); // Soft shadow
    max-height: 80vh; // Limit height and allow internal scrolling if needed
    display: flex; // Use flex for content layout
    flex-direction: column; // Stack title and list vertically

    h3 {
        margin-top: 0;
        margin-bottom: 20px;
        text-align: center;
        font-family: Poppins, sans-serif; // Consistent font
        font-size: 18px;
        font-weight: 600;
        color: #333; // Darker heading color
    }

    // Style the TokenSelector's internal list if needed
    // You might need to inspect the TokenSelector's output HTML structure
    ul {
        margin: 0;
        padding: 0;
        list-style: none;
        overflow-y: auto; // Enable scrolling if content exceeds max-height
    }

    li {
        // Basic styling for list items within the modal (assuming TokenSelector uses <li>)
        padding: 12px 8px;
        border-bottom: 1px solid #f0f0f0; // Lighter separator
        cursor: pointer;
        transition: background-color 0.15s ease;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-family: Poppins, sans-serif;
        font-size: 14px;

        &:last-child {
            border-bottom: none;
        }

        &:hover {
            background-color: #f7f7f7; // Slight hover effect
        }
    }
`;

export const SectionHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
`;

export const SectionHeaderLabel = styled.div`
    font-family: Poppins, sans-serif;
    font-weight: 600;
    font-size: 18px;
    line-height: 100%;
    letter-spacing: 0%;
    color: #333;
`;

export const SectionHeaderWrapper = styled.div`
    width: 100%;
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
`;

export const BackButton = styled.button`
    border-radius: 43px;
    padding: 2px 8px;
    gap: 3px;
    border-width: 1px;
    border: 1px solid #0000002e;

    font-family: Poppins, sans-serif;
    font-weight: 500;
    font-size: 10px;
`;

export const HeaderWrapper = styled.div`
    padding: 10px;
    width: 100%;
    display: flex;
    justify-content: space-between;
`;
export const HeaderItem = styled.div`
    display: flex;
    flex-direction: column;
    gap: 3px;
    align-items: start;
`;
export const StepHeader = styled.h3`
    font-family: Poppins, sans-serif;
    font-weight: 600;
    font-size: 16px;
    margin: 0;
`;

export const CurrentStep = styled.span`
    font-family: Poppins, sans-serif;
    font-weight: 600;
    font-size: 12px;
    ${({ theme }) =>
        theme.mode === 'dark'
            ? css`
                  color: rgba(255, 255, 255, 0.6);
                  strong {
                      color: white;
                  }
              `
            : css`
                  color: rbga(0, 0, 0, 0.6);
                  strong {
                      color: black;
                  }
              `}
`;

export const ConnectedWalletWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 5px;
    background: #ffffff80;
    padding: 5px 10px;
    border-radius: 12px;

    font-family: Poppins, sans-serif;
    font-weight: 600;
    font-size: 12px;

    cursor: pointer;
    transition: opacity 0.2s ease-in-out;
    &:hover {
        opacity: 0.5;
    }
`;

export const SubmitButtonWrapper = styled.div`
    width: 100%;
    margin-top: 20px;
`;
