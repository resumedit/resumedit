// @/mdx-components.tsx

import MarkdownImage from "@/mdx/components/Image";
import { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    img: MarkdownImage, // Use the custom MarkdownImage for image tags
    ...components,
  };
}
