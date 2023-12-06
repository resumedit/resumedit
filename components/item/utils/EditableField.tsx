// @/components/item/utils/EditableField.tsx

import EdiText, { EdiTextProps, InputProps } from "react-editext";

interface EditableFieldProps extends EdiTextProps {
  fieldName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (val: any, inputProps?: InputProps) => void;
}

const EditableField = ({ fieldName, value, onSave, ...rest }: EditableFieldProps) => {
  return (
    <EdiText
      type="text"
      value={value}
      onSave={onSave}
      // inputProps={{ name: fieldName }}
      inputProps={{
        name: fieldName,
        // onChange: onChange,
        className: "p-2 flex-1 rounded-md outline-none min-w-auto",
      }}
      // viewContainerClassName="flex gap-x-2"
      viewContainerClassName="w-full p-0 flex rounded-md hover:outline-dotted hover:outline-slate-300 active:outline-2 hover:active:outline-2"
      // viewProps={{ className: "flex-1" }}
      viewProps={{ className: "w-full p-2 rounded-md" }}
      editOnViewClick
      startEditingOnFocus
      submitOnEnter
      submitOnUnfocus
      cancelOnEscape
      saveButtonClassName="hidden"
      editButtonClassName="hidden"
      cancelButtonClassName="hidden"
      mainContainerClassName="p-0"
      editContainerClassName="p-0 rounded-md gap-x-2 bg-red-200"
      {...rest}
    />
  );
};

export default EditableField;
