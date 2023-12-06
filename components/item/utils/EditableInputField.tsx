// @/components/item/utils/EditableInputField.tsx

import EdiText, { EdiTextProps } from "react-editext";

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
      inputProps={{
        ...inputProps,
        name: fieldName,
        placeholder: placeholder || "",
        onChange: onChange,
        className: "p-2 flex-1 bg-slate-100 rounded-md outline-none min-w-auto",
        // ref: inputRef as RefObject<HTMLInputElement> & RefObject<HTMLTextAreaElement>,
      }}
      viewProps={{ placeholder: placeholder || "", className: "w-full p-2 rounded-md" }}
      // showButtonsOnHover
      editOnViewClick
      startEditingOnFocus
      submitOnEnter
      // submitOnUnfocus
      // cancelOnEscape
      // buttonContainerClassName="hidden"
      saveButtonClassName="hidden"
      editButtonClassName="hidden"
      cancelButtonClassName="hidden"
      mainContainerClassName="p-0"
      viewContainerClassName="w-full p-0 flex hover:bg-blue-50 rounded-md outline-2"
      editContainerClassName="p-0 rounded-md gap-x-2 bg-red-200"
      {...rest}
    />
  );
};

export default EditableInputField;
