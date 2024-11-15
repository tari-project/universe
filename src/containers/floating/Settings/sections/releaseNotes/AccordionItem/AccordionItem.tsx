import React from 'react';
import { Section, Header, TextWrapper, Title, Subtitle, Content, ChevronIcon } from './styles';

interface AccordionItemProps {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    content: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
}

export const AccordionItem = ({ title, subtitle, content, isOpen, onToggle }: AccordionItemProps) => {
    return (
        <Section>
            <Header onClick={onToggle}>
                <TextWrapper>
                    <Title>{title}</Title>
                    {subtitle && <Subtitle>{subtitle}</Subtitle>}
                </TextWrapper>
                <ChevronIcon $isOpen={isOpen} />
            </Header>
            <Content $isOpen={isOpen}>{content}</Content>
        </Section>
    );
};
