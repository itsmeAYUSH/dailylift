import { Layout } from "@/components/layout/Layout";
import { WorkoutHistorySkeleton } from "@/components/skeletons";

export default function WorkoutHistoryLoading() {
  return (
    <Layout>
      <WorkoutHistorySkeleton />
    </Layout>
  );
}
