import CurrencyInput from "react-native-currency-input";
import styled from "styled-components/native";

export const InputContainer = styled.View`
    gap: 4px;    
`;
export const InputLabel = styled.Text`
    font-size: 14px;
    color: #000000;
    font-weight: 400;
`;
export const InputError = styled.Text`
    font-size: 12px;
    color: #ff4d4d;
`;

export const TextInputContainer = styled.View`
    border: 1px solid #e2e2e2;
    border-radius: 8px;
    height: 40px;
    padding-horizontal: 8px;
    align-items: center;
    flex-direction: row;
    background-color: white;
    gap: 6px;
`;

export const StyledInput = styled.TextInput.attrs({
    placeholderTextColor: '#bbbbbb',
    style: { textAlignVertical: "center", includeFontPadding: false },
})`
    font-size: 16px;
    color: #000000;
    margin: 0px;
    padding: 0px;
    flex: 1;
    height: 100%;
`;

export const InputText = styled.Text<{ isPlaceholder?: boolean }>`    
    font-size: 16px;
    color: ${({ isPlaceholder }) => (isPlaceholder ? "#a5a5a5" : "#000000")};
    flex: 1;
`;

export const StyledCurrencyInput = styled(CurrencyInput).attrs({
    placeholderClassName: "text-gray-200",
})`
    font-size: 16px;
    color: #ffffff;    
    margin: 0px;
    padding: 0px;
`;
