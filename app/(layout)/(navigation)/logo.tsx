import Image from "next/image";

interface LogoProps {
  width?: number;
  height?: number;
}
const Logo = ({ width, height }: LogoProps) => {
  let logoWidth = 50;
  let logoHeight = 50;
  if (width) {
    logoWidth = width;
  }
  if (height) {
    logoHeight = height;
  } else {
    logoHeight = logoWidth;
  }
  return (
    <div>
      <Image src="/images/resumedit_logo.svg" width={logoWidth} height={logoHeight} alt="logo" />
    </div>
  );
};

export default Logo;
