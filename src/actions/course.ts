"use server";

import { whopsdk } from "@/lib/whop-sdk";
import { getWhopUser } from "@/lib/whop-auth";

// The course ID from the URL you provided
const COURSE_EXPERIENCE_ID = "exp_FWTfYlhQlrFhYv"; // Inner Market Mastery course

export async function getCourseProgress() {
  const userId = await getWhopUser();
  if (!userId) return null;

  try {
    // Get courses for the experience
    const courses = [];
    for await (const course of whopsdk.courses.list({ experience_id: COURSE_EXPERIENCE_ID })) {
      courses.push(course);
    }

    // Get lessons for each course
    const coursesWithLessons = await Promise.all(
      courses.map(async (course) => {
        const lessons = [];
        try {
          for await (const lesson of whopsdk.courseLessons.list({ course_id: course.id })) {
            lessons.push(lesson);
          }
        } catch (e) {
          console.error("Error fetching lessons:", e);
        }
        return {
          ...course,
          lessons,
        };
      })
    );

    return {
      courses: coursesWithLessons,
      userId,
    };
  } catch (error) {
    console.error("Error fetching course progress:", error);
    return null;
  }
}

export async function getLessonProgress(lessonId: string) {
  const userId = await getWhopUser();
  if (!userId) return null;

  try {
    // Check if user has completed this lesson
    // This would require checking course interactions
    return { completed: false };
  } catch (error) {
    console.error("Error fetching lesson progress:", error);
    return null;
  }
}
