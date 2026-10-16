import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../providers/ThemeProvider';

type ReviewFormProps = {
  submitting: boolean;
  onSubmit: (rating: number, comment: string) => Promise<boolean>;
};

/** Star picker + comment box; closes itself out on success via the boolean. */
export function ReviewForm({ submitting, onSubmit }: ReviewFormProps) {
  const { palette } = useTheme();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit() {
    setFormError(null);
    if (!comment.trim()) {
      setFormError('Write a few words about your visit.');
      return;
    }
    const ok = await onSubmit(rating, comment.trim());
    if (ok) {
      setComment('');
      setRating(5);
    } else {
      setFormError('Could not post your review. Try again.');
    }
  }

  return (
    <View style={[styles.form, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <Text style={[styles.label, { color: palette.ink }]}>Your rating</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${star} star${star > 1 ? 's' : ''}`}
            onPress={() => setRating(star)}
            style={styles.starHit}
          >
            <Text style={[styles.star, { color: star <= rating ? palette.accent : palette.border }]}>
              ★
            </Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        style={[styles.input, { borderColor: palette.border, color: palette.ink }]}
        placeholder="How was your visit?"
        placeholderTextColor={palette.muted}
        value={comment}
        onChangeText={setComment}
        multiline
        editable={!submitting}
      />
      <Pressable
        style={[styles.submit, { backgroundColor: palette.brand }, submitting && styles.disabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.submitText}>{submitting ? 'Posting…' : 'Post review'}</Text>
      </Pressable>
      {formError ? <Text style={[styles.error, { color: palette.danger }]}>{formError}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  stars: {
    flexDirection: 'row',
    marginTop: 4,
  },
  starHit: {
    padding: 4,
  },
  star: {
    fontSize: 28,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
    marginTop: 8,
  },
  submit: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  disabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  error: {
    marginTop: 8,
    fontSize: 13,
  },
});
