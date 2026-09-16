import { Layout } from "@/components/layout/Layout";
import { WorkoutLoggerSkeleton } from "@/components/skeletons";

export default function WorkoutLoggerLoading() {
  return (
    <Layout>
      <WorkoutLoggerSkeleton />
    </Layout>
  );
}
