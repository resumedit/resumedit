import { getCurrentUserOrNull } from "@/actions/user";
import WelcomeMessage from "@/app/(marketing)/(sections)/WelcomeMessage";
import { SignIn, SignedIn, SignedOut } from "@clerk/nextjs";

const SignInPage = async () => {
  const currentUser = await getCurrentUserOrNull();
  return (
    <>
      <SignedIn>
        <WelcomeMessage user={currentUser} />
      </SignedIn>
      <SignedOut>
        <SignIn />
      </SignedOut>
    </>
  );
};

export default SignInPage;
