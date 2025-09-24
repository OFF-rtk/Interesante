// Marketing layout for /features, /pricing, /about - NOT the root page
import { MarketingHeader } from "@/components/layout/marketing-header";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { ErrorBoundary } from "@/components/common/error-boundary";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <MarketingHeader />
      <ErrorBoundary>
        <main className="flex-1 pt-16"> {/* Add top padding to account for fixed header */}
          {children}
        </main>
      </ErrorBoundary>
      <MarketingFooter />
    </div>
  );
}
