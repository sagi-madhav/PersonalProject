import { getLessonById } from '../../../content';

export async function getLearnTopicTitle(topicId: string): Promise<string | null> {
  if (!topicId) return null;
  const lesson = getLessonById(topicId);
  if (lesson) return lesson.title;
  return topicId;
}
