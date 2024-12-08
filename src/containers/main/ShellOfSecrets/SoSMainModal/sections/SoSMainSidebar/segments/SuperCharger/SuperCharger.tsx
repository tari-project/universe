/* eslint-disable i18next/no-literal-string */
import { useState } from 'react';
import KeyIcon from './icons/KeyIcon';
import { Wrapper, TopBar, LineLeft, SectionLabel, LineRight, FormWrapper, InputField, SubmitButton } from './styles';

export default function SuperCharger() {
    const [code, setCode] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCode(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        console.log('Code submitted:', code);
        e.preventDefault();
    };

    return (
        <Wrapper>
            <TopBar>
                <LineLeft />
                <SectionLabel>Super Charger</SectionLabel>
                <LineRight />
            </TopBar>

            <FormWrapper onSubmit={handleSubmit}>
                <KeyIcon />

                <InputField placeholder="Enter Your Code" value={code} onChange={handleChange} />

                <SubmitButton>Go</SubmitButton>
            </FormWrapper>
        </Wrapper>
    );
}
