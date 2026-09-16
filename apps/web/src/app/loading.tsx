import { Layout } from "@/components/layout/Layout";
import { DashboardSkeleton } from "@/components/skeletons";

export default function RootLoading() {
  return (
    <Layout>
      <DashboardSkeleton />
    </Layout>
  );
}
