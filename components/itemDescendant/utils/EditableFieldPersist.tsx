// @/components/itemDescendant/utils/EditableInputField.tsx

import EdiText, { EdiTextProps } from "react-editext";
import { EditableFieldEdiTextProps } from "./EditableField";

interface EditableInputFieldProps extends EdiTextProps {
  fieldName: string;
  placeholder?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export default function EditableFieldPersist({
  fieldName,
  placeholder,
  onChange,
  inputProps,
  ...rest
}: EditableInputFieldProps) {
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
      }}
      viewProps={{ ...EditableFieldEdiTextProps.viewProps, placeholder: placeholder || "" }}
      {...rest}
    />
  );
}
