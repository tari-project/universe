import { ReactNode } from 'react';
import { Wrapper, IconWrapper, TextWrapper, Title, Text } from './styles';

interface StatusHeroProps {
    icon: ReactNode;
    title: string;
    children: ReactNode;
}

export function StatusHero({ icon, title, children }: StatusHeroProps) {
    return (
        <Wrapper>
            <IconWrapper>{icon}</IconWrapper>
            <TextWrapper>
                <Title>{title}</Title>
                <Text>{children}</Text>
            </TextWrapper>
        </Wrapper>
    );
}
