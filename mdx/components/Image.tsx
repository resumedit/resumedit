// @/components/mdx/Image.tsx

import Image from "next/image";
import React, { Ref } from "react";

// TODO: Incorporate ideas from [https://amirardalan.com/blog/use-next-image-with-react-markdown]

// Define the type for your custom Markdown image component props
export type MarkdownImageProps = React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;

const MarkdownImage = (props: MarkdownImageProps) => {
  const { alt, src, width, height, placeholder, ref, ...rest } = props;

  const imageAlt = alt || "Image";

  // Convert `src` to the format expected by Next.js Image component
  // Assume `src` is always provided and is a string
  const imageSrc = src || "";

  // Provide default values for `width` and `height` if not specified
  const imagWidth = Number(width) || 800;
  const imageHeight = Number(height) || 600;

  // Ensure that `placeholder` matches the type expected `by next/image`
  const imagePlaceholder = placeholder as "blur" | "empty" | `data:image/${string}` | undefined;

  // Ensure that `ref` matches the type expected `by next/image`
  const imageRef = ref as Ref<HTMLImageElement | null> | undefined;

  return (
    <Image
      src={imageSrc}
      alt={imageAlt}
      width={imagWidth}
      height={imageHeight}
      placeholder={imagePlaceholder}
      ref={imageRef}
      {...rest}
    />
  );
};

export default MarkdownImage;
