import { Layout } from "@/components/layout/Layout";
import { ExercisesSkeleton } from "@/components/skeletons";

export default function ExercisesLoading() {
  return (
    <Layout>
      <ExercisesSkeleton />
    </Layout>
  );
}
