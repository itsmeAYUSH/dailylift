import { Layout } from "@/components/layout/Layout";
import { DashboardSkeleton } from "@/components/skeletons";

export default function DashboardLoading() {
  return (
    <Layout>
      <DashboardSkeleton />
    </Layout>
  );
}
