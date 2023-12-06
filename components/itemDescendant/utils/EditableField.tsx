// @/components/itemDescendant/utils/EditableField.tsx

import EdiText, { EdiTextProps, InputProps } from "react-editext";

interface EditableFieldProps extends EdiTextProps {
  fieldName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (val: any, inputProps?: InputProps) => void;
}

export const EditableFieldEdiTextProps = {
  inputProps: {
    placeholder: "",
    className: "p-2 flex-1 rounded-md outline-none min-w-auto",
  },
  viewProps: {
    className: "w-full h-full min-h-[2.5rem] p-2 rounded-md",
  },
  rootProps: {
    viewContainerClassName:
      "w-full h-full p-0 rounded-md flex hover:outline-dotted hover:outline-slate-300 active:outline-2 hover:active:outline-2",
    editOnViewClick: true,
    startEditingOnFocus: true,
    submitOnEnter: true,
    saveButtonClassName: "invisible",
    editButtonClassName: "hidden",
    cancelButtonClassName: "hidden",
    mainContainerClassName: "p-0",
    editContainerClassName: "p-0 rounded-md gap-x-2",
  },
};

const EditableField = ({ fieldName, value, onSave, ...rest }: EditableFieldProps) => {
  return (
    <EdiText
      type="text"
      value={value}
      onSave={onSave}
      inputProps={{ ...EditableFieldEdiTextProps.inputProps, name: fieldName, placeholder: fieldName }}
      viewProps={{ ...EditableFieldEdiTextProps.viewProps }}
      {...EditableFieldEdiTextProps.rootProps}
      submitOnUnfocus
      cancelOnEscape
      {...rest}
    />
  );
};

export default EditableField;
