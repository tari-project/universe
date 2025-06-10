import { WalletActionButton as StyledButton } from './WalletButton.styles';

interface WalletButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'error' | 'success';
    size?: 'small' | 'medium' | 'large' | 'xl';
    disabled?: boolean;
}

export const WalletButton = ({ children, onClick, variant, size, disabled }: WalletButtonProps) => {
    return (
        <StyledButton onClick={onClick} $variant={variant} $size={size} disabled={disabled}>
            {children}
        </StyledButton>
    );
};
