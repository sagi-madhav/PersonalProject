import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Screen, Text, Button, EmptyState } from '../../../src/components';
import { useTheme } from '../../../src/theme';
import { learnRepo } from '../../../src/db/repos/learnRepo';
import { LearnProgressRecord } from '../../../src/db/types';
import { getLessonById } from '../../../content';
import {
  calculateNextReview,
  REVIEW_INTERVAL_DAYS,
} from '../../../src/features/learn/review';
import { lightHaptic, notificationSuccess } from '../../../src/lib/haptics';

interface ReviewQueueItem {
  progress: LearnProgressRecord;
  title: string;
  trackName: string;
  keyPoints: string[];
}

export default function SpacedReviewScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [queue, setQueue] = useState<ReviewQueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function loadDueReviews() {
      try {
        const dues = await learnRepo.getDueReviews(Date.now());
        const items: ReviewQueueItem[] = [];

        for (const p of dues) {
          const lesson = getLessonById(p.topic_id);
          if (lesson) {
            items.push({
              progress: p,
              title: lesson.title,
              trackName: lesson.track.toUpperCase(),
              keyPoints: lesson.keyPoints || ['Review core concepts and practice implementation.'],
            });
          } else {
            items.push({
              progress: p,
              title: p.topic_id,
              trackName: 'REVIEW',
              keyPoints: ['Review personal notes and summary.'],
            });
          }
        }

        if (!ignore) {
          setQueue(items);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('Failed to load due reviews', err);
        if (!ignore) setIsLoading(false);
      }
    }

    loadDueReviews();
    return () => {
      ignore = true;
    };
  }, []);

  const handleAnswer = useCallback(
    async (outcome: 'got_it' | 'forgot') => {
      const current = queue[currentIndex];
      if (!current) return;

      const currentStage = current.progress.review_stage;
      const result = calculateNextReview(currentStage, outcome, Date.now());

      await learnRepo.upsert({
        ...current.progress,
        review_stage: result.nextStage,
        last_reviewed_at: Date.now(),
        next_review_at: result.nextReviewAt,
      });

      if (outcome === 'got_it') {
        notificationSuccess();
      } else {
        lightHaptic();
      }

      setCompletedCount((prev) => prev + 1);
      setIsRevealed(false);
      setCurrentIndex((prev) => prev + 1);
    },
    [queue, currentIndex]
  );

  if (isLoading) {
    return (
      <Screen edges={['top']} padHorizontal>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <SymbolView name="chevron.left" tintColor={colors.text} size={20} />
          </Pressable>
          <Text variant="title">Spaced Review</Text>
        </View>
        <View style={styles.centerContainer}>
          <Text variant="body" color={colors.textSecondary}>
            Loading due cards...
          </Text>
        </View>
      </Screen>
    );
  }

  // All completed or no items in queue
  if (queue.length === 0 || currentIndex >= queue.length) {
    return (
      <Screen edges={['top']} padHorizontal>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <SymbolView name="chevron.left" tintColor={colors.text} size={20} />
          </Pressable>
          <Text variant="title">Spaced Review</Text>
        </View>

        <View style={styles.centerContainer}>
          <EmptyState
            message={
              completedCount > 0
                ? `Well done! You reviewed ${completedCount} ${
                    completedCount === 1 ? 'card' : 'cards'
                  } today.`
                : 'All caught up! No cards due for review right now.'
            }
          />
          <Button
            title="Return to Learn"
            variant="primary"
            onPress={() => router.back()}
            style={{ marginTop: 24, minWidth: 200 }}
          />
        </View>
      </Screen>
    );
  }

  const currentItem = queue[currentIndex];
  const stage = currentItem.progress.review_stage;
  const nextInterval = REVIEW_INTERVAL_DAYS[Math.min(5, stage + 1)] ?? 60;

  return (
    <Screen edges={['top']} padHorizontal>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <SymbolView name="chevron.left" tintColor={colors.text} size={20} />
        </Pressable>
        <Text variant="caption" color={colors.textSecondary}>
          Card {currentIndex + 1} of {queue.length}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Review Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.hairline },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text variant="caption" color={colors.accent}>
              {currentItem.trackName}
            </Text>
            <Text variant="caption" color={colors.textSecondary}>
              Stage {stage}/5 (Next: +{nextInterval}d)
            </Text>
          </View>

          <Text variant="title" style={styles.cardTitle}>
            {currentItem.title}
          </Text>

          {/* Reveal Key Points Section */}
          {!isRevealed ? (
            <Pressable
              onPress={() => {
                lightHaptic();
                setIsRevealed(true);
              }}
              style={[
                styles.revealPlaceholder,
                {
                  borderColor: colors.hairline,
                  backgroundColor: colors.surfaceAlt,
                },
              ]}
            >
              <SymbolView
                name="eye"
                tintColor={colors.accent}
                size={22}
                style={{ marginBottom: 6 }}
              />
              <Text variant="bodyStrong" color={colors.accent}>
                Tap to reveal key points
              </Text>
              <Text variant="caption" color={colors.textTertiary} style={{ marginTop: 2 }}>
                Test your active recall before flipping
              </Text>
            </Pressable>
          ) : (
            <View
              style={[
                styles.revealedContent,
                {
                  backgroundColor: colors.surfaceAlt,
                  borderColor: colors.hairline,
                },
              ]}
            >
              <Text variant="bodyStrong" color={colors.accent} style={{ marginBottom: 10 }}>
                Key Points
              </Text>
              {currentItem.keyPoints.map((pt, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text variant="body" color={colors.accent}>
                    •
                  </Text>
                  <Text variant="body" color={colors.text} style={{ flex: 1 }}>
                    {pt}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Big Action Buttons */}
        <View style={styles.actionsRow}>
          <View style={styles.actionCol}>
            <Button
              title="Forgot (1d)"
              variant="danger"
              onPress={() => handleAnswer('forgot')}
            />
          </View>
          <View style={styles.actionCol}>
            <Button
              title={`Got it (+${nextInterval}d)`}
              variant="primary"
              onPress={() => handleAnswer('got_it')}
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  backBtn: {
    padding: 4,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 16,
    borderWidth: 0.5,
    padding: 20,
    marginTop: 16,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    marginBottom: 24,
  },
  revealPlaceholder: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  revealedContent: {
    borderRadius: 12,
    borderWidth: 0.5,
    padding: 16,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 8,
  },
  actionCol: {
    flex: 1,
  },
});
