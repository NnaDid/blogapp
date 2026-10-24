import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/components/ui';
import { formatDate, isEnabled, type Post } from '@/lib/api';

export function PostCard({
  post,
  onLike,
  onReshare,
}: {
  post: Post;
  onLike: () => void;
  onReshare: () => void;
}) {
  return (
    <View style={styles.card}>
      {isEnabled(post.is_reshare) && (
        <Text style={styles.reshareLabel}>↻  {post.username} reshared</Text>
      )}
      <View style={styles.authorRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{post.username.slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={styles.authorInfo}>
          <Text style={styles.username}>{post.username}</Text>
          <Text style={styles.date}>{formatDate(post.created_at)}</Text>
        </View>
      </View>
      {!!post.content && <Text style={styles.content}>{post.content}</Text>}
      {post.original_post_id && (
        <View style={styles.original}>
          <Text style={styles.originalAuthor}>@{post.original_username || 'author'}</Text>
          <Text style={styles.originalContent}>
            {post.original_content || 'Original post unavailable.'}
          </Text>
        </View>
      )}
      <View style={styles.actions}>
        <Pressable onPress={onLike} accessibilityRole="button" accessibilityLabel="Like post">
          <Text style={[styles.action, isEnabled(post.liked_by_me) && styles.liked]}>
            {isEnabled(post.liked_by_me) ? '♥' : '♡'}  {Number(post.likes_count)}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: '/post/[id]',
              params: { id: String(post.id) },
            })
          }>
          <Text style={styles.action}>Comment  {Number(post.comments_count)}</Text>
        </Pressable>
        <Pressable onPress={onReshare} accessibilityRole="button">
          <Text style={styles.action}>↻  Reshare</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: 20,
    padding: 17,
    marginBottom: 13,
  },
  reshareLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 11,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  avatarText: {
    color: palette.green,
    fontSize: 17,
    fontWeight: '800',
  },
  authorInfo: {
    gap: 3,
  },
  username: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  date: {
    color: palette.muted,
    fontSize: 12,
  },
  content: {
    color: palette.ink,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 15,
  },
  original: {
    borderLeftWidth: 3,
    borderLeftColor: palette.green,
    backgroundColor: '#F8F8F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  originalAuthor: {
    color: palette.green,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 5,
  },
  originalContent: {
    color: palette.ink,
    fontSize: 14,
    lineHeight: 21,
  },
  actions: {
    borderTopWidth: 1,
    borderTopColor: palette.line,
    paddingTop: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  action: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  liked: {
    color: palette.orange,
  },
});
