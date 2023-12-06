// @/components/custom/InputEditable.tsx

import EdiText, { EdiTextProps } from "react-editext";

const InputEditable = (props: EdiTextProps) => {
  return <EdiText {...props} submitOnUnfocus startEditingOnFocus />;
};

export default InputEditable;
