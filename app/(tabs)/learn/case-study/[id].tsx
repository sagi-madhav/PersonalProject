import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, Text, Button, AppIcon } from '../../../../src/components';
import { useTheme } from '../../../../src/theme';
import { getCaseStudies, CaseStudy } from '../../../../content';
import { learnRepo } from '../../../../src/db/repos/learnRepo';
import { LearnProgressRecord } from '../../../../src/db/types';
import { lightHaptic, notificationSuccess } from '../../../../src/lib/haptics';

interface DesignNotesSections {
  requirements: string;
  estimation: string;
  api: string;
  dataModel: string;
  highLevelDesign: string;
  deepDives: string;
  tradeoffs: string;
}

const SECTION_CONFIG: { key: keyof DesignNotesSections; label: string; placeholder: string }[] = [
  {
    key: 'requirements',
    label: '1. Requirements (Functional & Non-Functional)',
    placeholder: 'What are users doing? Read/write ratio? Availability vs consistency goals? Latency SLA?',
  },
  {
    key: 'estimation',
    label: '2. Back-of-the-Envelope Estimation',
    placeholder: 'Daily active users, QPS (reads/sec, writes/sec), storage needed for 5 years, network bandwidth...',
  },
  {
    key: 'api',
    label: '3. API Design',
    placeholder: 'POST /v1/urls (request payload, response), GET /{shortCode} (301 vs 302 redirect), auth headers...',
  },
  {
    key: 'dataModel',
    label: '4. Data Model & Schema',
    placeholder: 'Database choice (Relational vs NoSQL), schema definitions, primary keys, indexing strategies...',
  },
  {
    key: 'highLevelDesign',
    label: '5. High-Level Design Architecture',
    placeholder: 'Client -> CDN -> Load Balancer -> Web App Tier -> Distributed Cache -> DB Shards...',
  },
  {
    key: 'deepDives',
    label: '6. Component Deep Dives',
    placeholder: 'Base62 key generation service, cache stampede prevention, rate limiting token bucket details...',
  },
  {
    key: 'tradeoffs',
    label: '7. Trade-offs & Failure Modes',
    placeholder: 'What happens if a shard dies? Data replication lag? Single points of failure (SPOF)?',
  },
];

export default function CaseStudyDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  const caseStudy: CaseStudy | undefined = id
    ? getCaseStudies().find((c) => c.id === id)
    : undefined;

  const topicKey = `cs-${id}`;

  const [sections, setSections] = useState<DesignNotesSections>({
    requirements: '',
    estimation: '',
    api: '',
    dataModel: '',
    highLevelDesign: '',
    deepDives: '',
    tradeoffs: '',
  });

  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let ignore = false;
    learnRepo
      .getByTopicId(topicKey)
      .then((record) => {
        if (!ignore && record) {
          setIsDone(record.status === 'done');
          if (record.notes) {
            try {
              const parsed = JSON.parse(record.notes);
              setSections((prev) => ({ ...prev, ...parsed }));
            } catch {
              // Legacy non-JSON note fallback
              setSections((prev) => ({ ...prev, requirements: record.notes || '' }));
            }
          }
        }
      })
      .catch((err) => console.warn('Failed to load case study note', err));

    return () => {
      ignore = true;
    };
  }, [topicKey]);

  const saveSections = useCallback(
    async (updated: DesignNotesSections, markDone?: boolean) => {
      const serialized = JSON.stringify(updated);
      const record: LearnProgressRecord = {
        topic_id: topicKey,
        status: (markDone ?? isDone) ? 'done' : 'learning',
        notes: serialized,
        review_stage: 0,
        last_reviewed_at: null,
        next_review_at: null,
        time_spent_ms: 0,
      };
      await learnRepo.upsert(record);
    },
    [topicKey, isDone]
  );

  const handleTextChange = (key: keyof DesignNotesSections, text: string) => {
    setSections((prev) => {
      const next = { ...prev, [key]: text };
      return next;
    });
  };

  const handleBlur = async () => {
    await saveSections(sections);
  };

  const toggleDone = async () => {
    const nextDone = !isDone;
    setIsDone(nextDone);
    if (nextDone) {
      notificationSuccess();
    } else {
      lightHaptic();
    }
    await saveSections(sections, nextDone);
  };

  if (!caseStudy) {
    return (
      <Screen edges={['top']} padHorizontal>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <AppIcon name="chevron-back" color={colors.text} size={20} />
          </Pressable>
          <Text variant="title">Case Study Not Found</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} padHorizontal>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <AppIcon name="chevron-back" color={colors.text} size={20} />
          </Pressable>
          <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
            {caseStudy.title}
          </Text>
        </View>
        <Pressable onPress={toggleDone} style={styles.statusPill}>
          <Text variant="caption" color={isDone ? colors.accent : colors.textSecondary}>
            {isDone ? '✓ Completed' : 'In Progress'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text variant="title" style={{ marginTop: 8, marginBottom: 4 }}>
          {caseStudy.title}
        </Text>
        <Text variant="caption" color={colors.textSecondary} style={{ marginBottom: 20 }}>
          {caseStudy.description}
        </Text>

        {SECTION_CONFIG.map(({ key, label, placeholder }) => (
          <View key={key} style={styles.sectionWrapper}>
            <Text variant="bodyStrong" color={colors.accent} style={{ marginBottom: 6 }}>
              {label}
            </Text>
            <TextInput
              placeholder={placeholder}
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              value={sections[key]}
              onChangeText={(text) => handleTextChange(key, text)}
              onBlur={handleBlur}
              style={[
                styles.sectionInput,
                {
                  color: colors.text,
                  backgroundColor: colors.surface,
                  borderColor: colors.hairline,
                },
              ]}
            />
          </View>
        ))}

        <Button
          title={isDone ? 'Mark as In-Progress' : 'Mark Case Study Complete'}
          variant={isDone ? 'secondary' : 'primary'}
          onPress={toggleDone}
          style={{ marginTop: 16 }}
        />
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingRight: 10,
  },
  backBtn: {
    padding: 4,
  },
  statusPill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionWrapper: {
    marginBottom: 20,
  },
  sectionInput: {
    borderRadius: 8,
    borderWidth: 0.5,
    padding: 12,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: 'top',
  },
});
