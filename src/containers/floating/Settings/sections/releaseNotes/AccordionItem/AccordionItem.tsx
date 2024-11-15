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
                <ChevronIcon $isOpen={isOpen} />
            </Header>
            <Content $isOpen={isOpen} initial={false} animate={{ height: isOpen ? 'auto' : 0 }}>
                <ContentPadding>{content}</ContentPadding>
            </Content>
        </Wrapper>
    );
};
