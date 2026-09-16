import { Layout } from "@/components/layout/Layout";
import { WorkoutsSkeleton } from "@/components/skeletons";

export default function WorkoutsLoading() {
  return (
    <Layout>
      <WorkoutsSkeleton />
    </Layout>
  );
}
