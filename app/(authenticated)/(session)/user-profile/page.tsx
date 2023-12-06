import { UserProfile } from "@clerk/nextjs";

const UserProfilePage = () => {
  return <UserProfile path="/user-profile" routing="path" />;
};

export default UserProfilePage;
