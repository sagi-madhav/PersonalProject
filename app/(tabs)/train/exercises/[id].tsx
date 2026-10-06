import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
import { Image } from 'expo-image';
import { Screen, Text, Button, Stepper } from '../../../../src/components';
import { useTheme } from '../../../../src/theme';
import { exercisesRepo } from '../../../../src/db/repos/exercisesRepo';
import { ExerciseRecord, ExercisePhotoRecord } from '../../../../src/db/types';
import { lightHaptic, notificationWarning } from '../../../../src/lib/haptics';

export default function ExerciseDetailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [exercise, setExercise] = useState<ExerciseRecord | null>(null);
  const [photos, setPhotos] = useState<ExercisePhotoRecord[]>([]);
  const [setup, setSetup] = useState('');
  const [notes, setNotes] = useState('');
  const [defaultRest, setDefaultRest] = useState(90);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const ex = await exercisesRepo.getById(id);
      if (ex) {
        setExercise(ex);
        setSetup(ex.setup ?? '');
        setNotes(ex.notes ?? '');
        setDefaultRest(ex.default_rest_sec ?? 90);
      }
      const ph = await exercisesRepo.getPhotos(id);
      setPhotos(ph);
    } catch (err) {
      console.warn('Failed to load exercise details', err);
    }
  }, [id]);

  useEffect(() => {
    let ignore = false;
    if (id) {
      exercisesRepo.getById(id).then((ex) => {
        if (!ignore && ex) {
          setExercise(ex);
          setSetup(ex.setup ?? '');
          setNotes(ex.notes ?? '');
          setDefaultRest(ex.default_rest_sec ?? 90);
        }
      }).catch((err) => console.warn('Failed to load exercise details', err));

      exercisesRepo.getPhotos(id).then((ph) => {
        if (!ignore) {
          setPhotos(ph);
        }
      }).catch((err) => console.warn('Failed to load photos', err));
    }
    return () => {
      ignore = true;
    };
  }, [id]);

  const handleSave = async () => {
    if (!exercise) return;
    setIsSaving(true);
    try {
      await exercisesRepo.update({
        id: exercise.id,
        setup: setup.trim() || null,
        notes: notes.trim() || null,
        default_rest_sec: defaultRest,
      });
      lightHaptic();
      Alert.alert('Saved', 'Exercise settings updated.');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPhoto = () => {
    Alert.alert('Add Machine Photo', 'Choose photo source', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Take Photo',
        onPress: async () => {
          const res = await ImagePicker.launchCameraAsync({
            quality: 0.7,
            allowsEditing: true,
          });
          if (!res.canceled && res.assets[0]?.uri) {
            await savePhotoAsset(res.assets[0].uri);
          }
        },
      },
      {
        text: 'Choose from Library',
        onPress: async () => {
          const res = await ImagePicker.launchImageLibraryAsync({
            quality: 0.7,
            allowsEditing: true,
          });
          if (!res.canceled && res.assets[0]?.uri) {
            await savePhotoAsset(res.assets[0].uri);
          }
        },
      },
    ]);
  };

  const savePhotoAsset = async (sourceUri: string) => {
    if (!exercise) return;
    try {
      const filename = `photo-${Crypto.randomUUID()}.jpg`;
      const targetDir = `${FileSystem.documentDirectory}machine-photos/`;
      const dirInfo = await FileSystem.getInfoAsync(targetDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });
      }

      const targetPath = `${targetDir}${filename}`;
      await FileSystem.copyAsync({ from: sourceUri, to: targetPath });

      await exercisesRepo.addPhoto({
        id: Crypto.randomUUID(),
        exercise_id: exercise.id,
        filename,
        caption: null,
        taken_at: Date.now(),
      });

      lightHaptic();
      loadData();
    } catch (err: any) {
      Alert.alert('Failed to save photo', err.message);
    }
  };

  const handleDeletePhoto = (photo: ExercisePhotoRecord) => {
    Alert.alert('Delete Photo', 'Remove this machine photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await exercisesRepo.deletePhoto(photo.id);
          notificationWarning();
          loadData();
        },
      },
    ]);
  };

  if (!exercise) {
    return (
      <Screen edges={['top']} padHorizontal>
        <Text>Loading exercise...</Text>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <SymbolView name="chevron.left" tintColor={colors.text} size={20} />
        </Pressable>
        <Text variant="heading" numberOfLines={1} style={styles.title}>
          {exercise.name}
        </Text>
        <Button
          title={isSaving ? '...' : 'Save'}
          size="sm"
          onPress={handleSave}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Machine Photos Carousel */}
        <View style={styles.photosSection}>
          <Text variant="caption" color={colors.textSecondary} style={styles.sectionTitle}>
            MACHINE PHOTOS & SETTINGS
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosRow}>
            {photos.map((p) => {
              const fullUri = `${FileSystem.documentDirectory}machine-photos/${p.filename}`;
              return (
                <Pressable
                  key={p.id}
                  onLongPress={() => handleDeletePhoto(p)}
                  style={styles.photoContainer}
                >
                  <Image source={{ uri: fullUri }} style={styles.photoImg} />
                </Pressable>
              );
            })}

            <Pressable
              onPress={handleAddPhoto}
              style={[styles.addPhotoTile, { borderColor: colors.hairline, backgroundColor: colors.surfaceAlt }]}
              accessibilityLabel="Add machine photo"
            >
              <SymbolView name="camera" tintColor={colors.accent} size={24} />
              <Text variant="micro" color={colors.accent} style={{ marginTop: 6 }}>
                + Photo
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* Setup Line */}
        <View style={styles.formSection}>
          <Text variant="caption" color={colors.textSecondary} style={styles.sectionTitle}>
            MACHINE SETUP (SEAT, PAD, PIN)
          </Text>
          <TextInput
            placeholder="e.g. Seat 4, pad 3, pin 7"
            placeholderTextColor={colors.textTertiary}
            value={setup}
            onChangeText={setSetup}
            style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceAlt }]}
          />
        </View>

        {/* Form Cues & Notes */}
        <View style={styles.formSection}>
          <Text variant="caption" color={colors.textSecondary} style={styles.sectionTitle}>
            FORM CUES & NOTES
          </Text>
          <TextInput
            placeholder="Cues, reminders, adjustments..."
            placeholderTextColor={colors.textTertiary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            style={[styles.notesInput, { color: colors.text, backgroundColor: colors.surfaceAlt }]}
          />
        </View>

        {/* Default Rest Timer */}
        <View style={styles.formSection}>
          <Text variant="caption" color={colors.textSecondary} style={styles.sectionTitle}>
            DEFAULT REST TIMER
          </Text>
          <View style={styles.stepperWrap}>
            <Stepper
              value={defaultRest}
              step={15}
              min={15}
              max={300}
              format={(v) => `${v}s`}
              onChange={setDefaultRest}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    flex: 1,
    marginHorizontal: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  photosSection: {
    marginTop: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  photosRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoContainer: {
    width: 110,
    height: 110,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  addPhotoTile: {
    width: 110,
    height: 110,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formSection: {
    marginBottom: 20,
  },
  input: {
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  notesInput: {
    minHeight: 80,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  stepperWrap: {
    alignItems: 'flex-start',
  },
});
