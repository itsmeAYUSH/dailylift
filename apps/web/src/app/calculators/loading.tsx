import { Layout } from "@/components/layout/Layout";
import { CalculatorsSkeleton } from "@/components/skeletons";

export default function CalculatorsLoading() {
  return (
    <Layout>
      <CalculatorsSkeleton />
    </Layout>
  );
}
