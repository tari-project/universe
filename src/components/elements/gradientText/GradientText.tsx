import { ReactNode } from 'react';
import { AnimatedGradientText, TextContent } from './styles.ts';

interface GradientTextProps {
    children: ReactNode;
    className?: string;
    colors?: string[];
    animationSpeed?: number;
    showBorder?: boolean;
}

export default function GradientText({
    children,
    colors = ['#C9EB00', '#FFFFFF'],
    animationSpeed = 8,
}: GradientTextProps) {
    const gradientStyle = {
        backgroundImage: `linear-gradient(to right, ${colors.join(', ')})`,
        animationDuration: `${animationSpeed}s`,
    };

    return (
        <AnimatedGradientText>
            <TextContent style={gradientStyle}>{children}</TextContent>
        </AnimatedGradientText>
    );
}
