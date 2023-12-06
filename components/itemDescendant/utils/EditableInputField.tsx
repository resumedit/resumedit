// @/components/itemDescendant/utils/EditableInputField.tsx

import EdiText, { EdiTextProps } from "react-editext";
import { EditableFieldEdiTextProps } from "./EditableField";

interface EditableInputFieldProps extends EdiTextProps {
  fieldName: string;
  placeholder?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => void;
  // inputRef: RefObject<HTMLInputElement> & RefObject<HTMLTextAreaElement>;
}

const EditableInputField = ({ fieldName, placeholder, onChange, inputProps, ...rest }: EditableInputFieldProps) => {
  return (
    <EdiText
      type="text"
      {...EditableFieldEdiTextProps.rootProps}
      inputProps={{
        ...EditableFieldEdiTextProps.inputProps,
        ...inputProps,
        name: fieldName,
        placeholder: placeholder || "",
        onChange: onChange,
        className: "p-2 flex-1 rounded-md outline-none min-w-auto",
      }}
      viewProps={{ ...EditableFieldEdiTextProps.viewProps, placeholder: placeholder || "" }}
      {...rest}
    />
  );
};

export default EditableInputField;
