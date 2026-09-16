import { Layout } from "@/components/layout/Layout";
import { ProgressSkeleton } from "@/components/skeletons";

export default function ProgressLoading() {
  return (
    <Layout>
      <ProgressSkeleton />
    </Layout>
  );
}
