// @/components/item/utils/EditableField.tsx

import EdiText, { EdiTextProps, InputProps } from "react-editext";

interface EditableFieldProps extends EdiTextProps {
  fieldName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (val: any, inputProps?: InputProps) => void;
}

const EditableField = ({ fieldName, value, onSave }: EditableFieldProps) => {
  return (
    <EdiText
      type="text"
      value={value}
      onSave={onSave}
      inputProps={{ name: fieldName }}
      viewContainerClassName="flex gap-x-2"
      viewProps={{ className: "flex-1" }}
      showButtonsOnHover
      editOnViewClick
      startEditingOnFocus
      submitOnEnter
      submitOnUnfocus
      cancelOnEscape
    />
  );
};

export default EditableField;
