// @/app/(marketing)/layout.tsx

import MarketingContentLayout from "./MarketingContentLayout";

export default function MarketingRootLayout({ children }: { children: React.ReactNode }) {
  return <MarketingContentLayout>{children}</MarketingContentLayout>;
}
