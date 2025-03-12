import styled from 'styled-components';
import { type TabNavProps } from './types';
import { useTranslation } from 'react-i18next';

const Wrapper = styled.div`
    display: grid;
    padding: 20px;
    place-items: center;
    grid-auto-flow: column;
    width: 100%;
`;

const NavButton = styled.button.attrs({
    role: 'tab',
})<{ $isActive?: boolean }>`
    display: flex;
    color: ${({ theme }) => theme.palette.text.primary};
    opacity: ${({ $isActive }) => ($isActive ? 1 : 0.7)};

    &:hover {
        opacity: 0.85;
    }
`;

function TabNav({ items, currentIndex, onClick }: TabNavProps) {
    const { t } = useTranslation();
    return (
        <Wrapper>
            {items.map(({ id, titleTransaltionKey }, i) => {
                const isActive = currentIndex === i;
                return (
                    <NavButton
                        key={`item:${i}-${id}`}
                        onClick={() => onClick(i)}
                        $isActive={isActive}
                        aria-selected={isActive}
                        id={`tab-${id}`}
                    >
                        {t(titleTransaltionKey)}
                    </NavButton>
                );
            })}
        </Wrapper>
    );
}

export { TabNav };
