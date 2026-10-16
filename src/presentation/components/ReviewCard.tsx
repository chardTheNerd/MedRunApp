import { StyleSheet, Text, View } from 'react-native';
import { PharmacyReview } from '../../domain/entities/PharmacyReview';
import { useTheme } from '../providers/ThemeProvider';

/** One pharmacy review: stars, author, date, and comment. */
export function ReviewCard({ review }: { review: PharmacyReview }) {
  const { palette } = useTheme();
  const filled = Math.min(5, Math.max(1, Math.round(review.rating)));
  return (
    <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <View style={styles.header}>
        <Text style={[styles.stars, { color: palette.accent }]}>
          {'★'.repeat(filled)}
          <Text style={{ color: palette.border }}>{'★'.repeat(5 - filled)}</Text>
        </Text>
        <Text style={[styles.meta, { color: palette.muted }]}>
          {review.authorName || 'Verified patient'} ·{' '}
          {review.createdAt.toLocaleDateString('en-NG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </Text>
      </View>
      <Text style={[styles.comment, { color: palette.ink }]}>{review.comment}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  stars: {
    fontSize: 14,
    fontWeight: '700',
  },
  meta: {
    fontSize: 12,
  },
  comment: {
    fontSize: 14,
    marginTop: 6,
  },
});
