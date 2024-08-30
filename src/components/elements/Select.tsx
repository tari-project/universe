import styled from 'styled-components';
import { HiOutlineSelector } from 'react-icons/hi';
import { useState, MouseEvent } from 'react';
import { Typography } from '@app/components/elements/Typography.tsx';

const Wrapper = styled.div`
    width: 100%;
    background: ${({ theme }) => theme.palette.background.paper};
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    cursor: pointer;
`;

const StyledSelect = styled.div`
    display: flex;
    flex-direction: column;
`;

const Options = styled.div<{ $open?: boolean }>`
    display: flex;
    flex-direction: column;
    width: 100%;
    position: absolute;
    box-shadow: 0 0 45px 0 rgba(0, 0, 0, 0.15);
    background: ${({ theme }) => theme.palette.background.paper};
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    padding: 10px 8px;
    gap: 4px;
    z-index: 1;
    right: 20px;
    height: ${({ $open }) => ($open ? 'auto' : 0)};
    opacity: ${({ $open }) => ($open ? 1 : 0)};
    pointer-events: ${({ $open }) => ($open ? 'all' : 'none')};
    transition: all 0.1s ease-in;
`;

const StyledOption = styled.div<{ $selected?: boolean }>`
    display: flex;
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 17px;
    font-weight: 500;
    letter-spacing: -1px;
    background: ${({ theme }) => theme.palette.background.paper};
    text-transform: uppercase;
    line-height: 1;
    cursor: pointer;
    padding: ${({ $selected }) => ($selected ? '0' : '2px 4px')};
    border-radius: 3px;
    transition: all 0.2s ease-in-out;
    &:hover {
        background: ${({ theme, $selected }) => ($selected ? 'none' : theme.palette.colors.grey[50])};
    }
`;

const IconWrapper = styled.div`
    display: flex;
`;

interface Option {
    label: string;
    value: string;
}

interface Props {
    options: Option[];
    selectedValue?: Option['value'];
    onChange: (value: Option['value']) => void;
}

type OnClickEvent = MouseEvent<HTMLDivElement>;

export function Select({ options, selectedValue, onChange, ...props }: Props) {
    const [expanded, setExpanded] = useState(false);

    function toggleOpen(e: OnClickEvent) {
        e.stopPropagation();
        setExpanded((c) => !c);
    }

    function handleChange(e: OnClickEvent, value: string) {
        e.stopPropagation();
        onChange(value);
        setExpanded(false);
    }

    const selectedLabel = selectedValue ? options.find((o) => o.value === selectedValue)?.label : options[0].label;
    return (
        <Wrapper onClick={(e) => toggleOpen(e)}>
            <StyledSelect {...props}>
                <StyledOption $selected>
                    <Typography variant="h5">{selectedLabel}</Typography>
                </StyledOption>
                <Options id="select-options" tabIndex={0} $open={expanded}>
                    {options.map(({ label, value }) => (
                        <StyledOption onClick={(e) => handleChange(e, value)} key={`opt-${value}-${label}`}>
                            <Typography variant="h5">{label}</Typography>
                        </StyledOption>
                    ))}
                </Options>
            </StyledSelect>

            <IconWrapper>
                <HiOutlineSelector />
            </IconWrapper>
        </Wrapper>
    );
}
