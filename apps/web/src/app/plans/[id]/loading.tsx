import { Layout } from "@/components/layout/Layout";
import { PlanDetailSkeleton } from "@/components/skeletons";

export default function PlanDetailLoading() {
  return (
    <Layout>
      <PlanDetailSkeleton />
    </Layout>
  );
}
