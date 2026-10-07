import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Markdown from 'react-native-markdown-display';
import { Screen, Text, Button, Chip, AppIcon } from '../../../../src/components';
import { useTheme } from '../../../../src/theme';
import { getLessonById } from '../../../../content';
import { learnRepo } from '../../../../src/db/repos/learnRepo';
import { LearnProgressRecord, LearnStatus } from '../../../../src/db/types';
import { scheduleInitialReview } from '../../../../src/features/learn/review';
import { lightHaptic, notificationSuccess } from '../../../../src/lib/haptics';

export default function LessonScreen() {
  const router = useRouter();
  const { track, topicId } = useLocalSearchParams<{ track: string; topicId: string }>();
  const { colors } = useTheme();

  const lesson = topicId ? getLessonById(topicId) : undefined;

  const [progress, setProgress] = useState<LearnProgressRecord | null>(null);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<LearnStatus>('todo');

  useEffect(() => {
    let ignore = false;
    if (topicId) {
      learnRepo
        .getByTopicId(topicId)
        .then((p) => {
          if (!ignore && p) {
            setProgress(p);
            setStatus(p.status);
            setNotes(p.notes ?? '');
          }
        })
        .catch((err) => console.warn('Failed to load lesson progress', err));
    }
    return () => {
      ignore = true;
    };
  }, [topicId]);

  const saveProgress = useCallback(
    async (newStatus: LearnStatus, newNotes: string) => {
      if (!topicId) return;
      const existing = progress;
      const isNewlyDone = newStatus === 'done' && existing?.status !== 'done';
      const reviewUpdate = isNewlyDone
        ? scheduleInitialReview()
        : {
            nextStage: existing?.review_stage ?? 0,
            nextReviewAt: existing?.next_review_at ?? null,
          };

      const updatedRecord: LearnProgressRecord = {
        topic_id: topicId,
        status: newStatus,
        notes: newNotes.trim() || null,
        review_stage: reviewUpdate.nextStage,
        last_reviewed_at: existing?.last_reviewed_at ?? null,
        next_review_at: reviewUpdate.nextReviewAt,
        time_spent_ms: existing?.time_spent_ms ?? 0,
      };

      await learnRepo.upsert(updatedRecord);
      setProgress(updatedRecord);
    },
    [topicId, progress]
  );

  const cycleStatus = async () => {
    lightHaptic();
    const nextStatus: LearnStatus =
      status === 'todo' ? 'learning' : status === 'learning' ? 'done' : 'todo';
    setStatus(nextStatus);
    await saveProgress(nextStatus, notes);
  };

  const handleNotesChange = (text: string) => {
    setNotes(text);
  };

  const handleNotesBlur = async () => {
    await saveProgress(status, notes);
  };

  const handleMarkDone = async () => {
    notificationSuccess();
    setStatus('done');
    await saveProgress('done', notes);
  };

  const handleStartFocus = () => {
    if (!lesson) return;
    router.push({
      pathname: '/(tabs)/focus',
      params: {
        topicId: lesson.id,
        label: lesson.title,
      },
    });
  };

  const handleScheduleStudy = () => {
    if (!lesson) return;
    router.push({
      pathname: '/block/[id]',
      params: {
        id: 'new',
        title: `Study: ${lesson.title}`,
        kind: 'study',
        linkType: 'topic',
        linkId: lesson.id,
      },
    });
  };

  if (!lesson) {
    return (
      <Screen edges={['top']} padHorizontal>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <AppIcon name="chevron-back" color={colors.text} size={20} />
          </Pressable>
          <Text variant="title">Lesson Not Found</Text>
        </View>
        <Text variant="body" color={colors.textSecondary}>
          Could not find lesson: {topicId}
        </Text>
      </Screen>
    );
  }

  const markdownStyles = {
    body: {
      color: colors.text,
      fontSize: 16,
      lineHeight: 24,
    },
    heading1: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '700' as const,
      marginTop: 20,
      marginBottom: 8,
    },
    heading2: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '600' as const,
      marginTop: 18,
      marginBottom: 8,
    },
    heading3: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600' as const,
      marginTop: 16,
      marginBottom: 6,
    },
    paragraph: {
      color: colors.text,
      fontSize: 16,
      lineHeight: 24,
      marginBottom: 12,
    },
    list_item: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 22,
      marginVertical: 3,
    },
    code_inline: {
      backgroundColor: colors.surfaceAlt,
      color: colors.accent,
      fontFamily: 'Menlo',
      fontSize: 14,
      borderRadius: 4,
      paddingHorizontal: 4,
    },
    code_block: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.hairline,
      borderWidth: 0.5,
      borderRadius: 8,
      padding: 12,
      fontFamily: 'Menlo',
      fontSize: 13,
      color: colors.text,
      marginVertical: 10,
    },
    fence: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.hairline,
      borderWidth: 0.5,
      borderRadius: 8,
      padding: 12,
      fontFamily: 'Menlo',
      fontSize: 13,
      color: colors.text,
      marginVertical: 10,
    },
  };

  return (
    <Screen edges={['top']} padHorizontal>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <AppIcon name="chevron-back" color={colors.text} size={20} />
        </Pressable>
        <Text variant="caption" color={colors.textSecondary}>
          {track?.toUpperCase()} · {lesson.module}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Title */}
        <Text variant="title" style={styles.lessonTitle}>
          {lesson.title}
        </Text>

        {/* Metadata row */}
        <View style={styles.metaRow}>
          <Text variant="caption" color={colors.textSecondary}>
            ⏱ {lesson.estMinutes} mins · {lesson.module}
          </Text>
          <Pressable onPress={cycleStatus}>
            <Chip
              label={status.toUpperCase()}
              selected={status === 'done'}
              onPress={cycleStatus}
            />
          </Pressable>
        </View>

        {/* Lesson Body */}
        <View style={styles.markdownWrapper}>
          <Markdown style={markdownStyles}>{lesson.body}</Markdown>
        </View>

        {/* Key Points for Review */}
        {lesson.keyPoints && lesson.keyPoints.length > 0 && (
          <View
            style={[
              styles.keyPointsBox,
              { backgroundColor: colors.surfaceAlt, borderColor: colors.hairline },
            ]}
          >
            <Text variant="bodyStrong" color={colors.accent} style={{ marginBottom: 8 }}>
              Key Points for Spaced Review
            </Text>
            {lesson.keyPoints.map((pt, idx) => (
              <View key={idx} style={styles.keyPointBullet}>
                <Text variant="caption" color={colors.accent}>
                  •
                </Text>
                <Text variant="caption" color={colors.text} style={{ flex: 1 }}>
                  {pt}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* My Notes section */}
        <View style={styles.notesSection}>
          <Text variant="bodyStrong" style={{ marginBottom: 8 }}>
            My Notes
          </Text>
          <TextInput
            style={[
              styles.notesInput,
              {
                backgroundColor: colors.surface,
                borderColor: colors.hairline,
                color: colors.text,
              },
            ]}
            placeholder="Write personal takeaways, reflections, or reminders..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={handleNotesChange}
            onBlur={handleNotesBlur}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            title={status === 'done' ? 'Completed' : 'Mark Done (+1d Review)'}
            icon={
              <AppIcon
                name={status === 'done' ? 'checkmark-circle' : 'checkmark'}
                size={16}
                color={colors.inkText}
              />
            }
            variant="primary"
            onPress={handleMarkDone}
            style={{ marginBottom: 10 }}
          />

          <View style={styles.secondaryActionsRow}>
            <View style={{ flex: 1 }}>
              <Button
                title="Start Focus"
                icon={<AppIcon name="timer-outline" size={15} color={colors.text} />}
                variant="secondary"
                size="sm"
                onPress={handleStartFocus}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title="Schedule Study"
                icon={<AppIcon name="calendar-outline" size={15} color={colors.text} />}
                variant="secondary"
                size="sm"
                onPress={handleScheduleStudy}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  backBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  lessonTitle: {
    marginVertical: 10,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  markdownWrapper: {
    paddingVertical: 4,
  },
  keyPointsBox: {
    borderRadius: 10,
    borderWidth: 0.5,
    padding: 14,
    marginVertical: 16,
  },
  keyPointBullet: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  notesSection: {
    marginVertical: 16,
  },
  notesInput: {
    borderRadius: 8,
    borderWidth: 0.5,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actionsContainer: {
    marginTop: 10,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
