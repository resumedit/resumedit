import { getCurrentUserOrNull } from "@/actions/user";
import WelcomeMessage from "@/app/(marketing)/(sections)/WelcomeMessage";
import { SignUp, SignedIn, SignedOut } from "@clerk/nextjs";

const SignUpPage = async () => {
  const currentUser = await getCurrentUserOrNull();
  return (
    <>
      <SignedIn>
        <WelcomeMessage user={currentUser} />
      </SignedIn>
      <SignedOut>
        <SignUp />
      </SignedOut>
    </>
  );
};

export default SignUpPage;
