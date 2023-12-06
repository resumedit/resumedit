import React from "react";
import { ImSpinner3 } from "react-icons/im";
import { cn } from "@/lib/utils";
const LoadingSpinner = ({ width, height }: { width?: number; height?: number }) => {
  const spinnerWidth = width ? width : 12;
  const spinnerHeight = height ? height : spinnerWidth;
  return <ImSpinner3 className={cn(`animate-spin h-${spinnerWidth} w-${spinnerHeight}`)} />;
};

export default LoadingSpinner;
