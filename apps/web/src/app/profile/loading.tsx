import { Layout } from "@/components/layout/Layout";
import { ProfileSkeleton } from "@/components/skeletons";

export default function ProfileLoading() {
  return (
    <Layout>
      <ProfileSkeleton />
    </Layout>
  );
}
