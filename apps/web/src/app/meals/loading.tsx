import { Layout } from "@/components/layout/Layout";
import { MealsSkeleton } from "@/components/skeletons";

export default function MealsLoading() {
  return (
    <Layout>
      <MealsSkeleton />
    </Layout>
  );
}
