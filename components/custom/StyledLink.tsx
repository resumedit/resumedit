import { Link as RadixLink } from "@radix-ui/themes";
import NextLink from "next/link";
import { ReactNode } from "react";

interface LinkProps {
  href: string;
  children: ReactNode;
}

// Define a type for RadixLink properties by extracting those from RadixLink's props
type RadixLinkProps = Extract<React.ComponentProps<typeof RadixLink>, unknown>;

const StyledLink = ({ href, children, ...props }: LinkProps & RadixLinkProps) => {
  return (
    <NextLink href={href} {...props} passHref legacyBehavior>
      <RadixLink href={href} {...props}>
        {children}
      </RadixLink>
    </NextLink>
  );
};

export default StyledLink;
