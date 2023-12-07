import AppSettingsSheet from "@/components/appSettings/AppSettingsSheet";
import { DarkModeToggle } from "@/components/custom/DarkModeToggle";
import { NavbarProps } from "./Navbar";
import { SignupNavigation } from "./SignupNavigation";
import { UserProfileNavigation } from "./UserProfileNavigation";

interface NavigationActionButtonsProps extends NavbarProps {}

export default async function NavigationActionButtons(props: NavigationActionButtonsProps) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-4">
        <AppSettingsSheet />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-4">
        <DarkModeToggle />
      </div>
      <SignupNavigation {...props} />
      <div className="flex items-center gap-4">
        <UserProfileNavigation {...props} />
      </div>
    </div>
  );
}
