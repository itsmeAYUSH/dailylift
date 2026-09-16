import { Layout } from "@/components/layout/Layout";
import { PlansSkeleton } from "@/components/skeletons";

export default function PlansLoading() {
  return (
    <Layout>
      <PlansSkeleton />
    </Layout>
  );
}
