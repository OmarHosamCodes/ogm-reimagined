import { notFound } from "next/navigation";

import { eq } from "@ogm/db";
import { db } from "@ogm/db/client";
import { communities } from "@ogm/db/schema";

import { CourseGrid } from "../_components/course-grid";

interface CoursesPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CoursesPage({ params }: CoursesPageProps) {
  const { slug } = await params;

  const community = await db.query.communities.findFirst({
    where: eq(communities.slug, slug),
  });

  if (!community) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Courses</h1>
        <p className="text-muted-foreground">
          Explore our learning content and level up your skills.
        </p>
      </div>

      <CourseGrid communityId={community.id} />
    </div>
  );
}
