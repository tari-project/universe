import React from 'react';
import { Wrapper, Header, TextWrapper, Title, Subtitle, Content, ChevronIcon, ContentPadding } from './styles';

interface AccordionItemProps {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    content: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
}

export const AccordionItem = ({ title, subtitle, content, isOpen, onToggle }: AccordionItemProps) => {
    return (
        <Wrapper>
            <Header onClick={onToggle}>
                <TextWrapper>
                    <Title>{title}</Title>
                    {subtitle && <Subtitle>{subtitle}</Subtitle>}
                </TextWrapper>
                <ChevronIcon $isOpen={isOpen} viewBox="0 0 24 24">
                    <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                </ChevronIcon>
            </Header>
            <Content $isOpen={isOpen} initial={false} animate={{ height: isOpen ? 'auto' : 0 }}>
                <ContentPadding>{content}</ContentPadding>
            </Content>
        </Wrapper>
    );
};
