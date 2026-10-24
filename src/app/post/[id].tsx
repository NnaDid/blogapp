import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button, Field, palette } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import {
  createComment,
  fetchComments,
  fetchPost,
  formatDate,
  isEnabled,
  resharePost,
  setPostLike,
  type Comment,
  type Post,
} from '@/lib/api';

export default function PostDetailScreen() {
  const { id: routeId } = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(routeId) ? routeId[0] : routeId;
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const userId = user?.id;

  useEffect(() => {
    if (!id || !userId) return;
    let active = true;
    void Promise.all([
      fetchPost(id, userId),
      fetchComments(id, 1, 50),
    ])
      .then(([postResponse, commentsResponse]) => {
        if (!active) return;
        setPost(postResponse.data);
        setComments(commentsResponse.data);
        setError('');
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : 'Could not load this post.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, userId]);

  const loadPost = useCallback(async () => {
    if (!id) return;
    try {
      const [postResponse, commentsResponse] = await Promise.all([
        fetchPost(id, userId ?? ''),
        fetchComments(id, 1, 50),
      ]);
      setPost(postResponse.data);
      setComments(commentsResponse.data);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load this post.');
    } finally {
      setLoading(false);
    }
  }, [id, userId]);

  async function submitComment() {
    const text = content.trim();
    if (!text || !id) return;
    setSubmitting(true);
    try {
      if (!user) throw new Error('Sign in to comment.');
      const response = await createComment(id, user.id, text);
      setComments((current) => [...current, response.data]);
      setPost((current) =>
        current ? { ...current, comments_count: Number(current.comments_count) + 1 } : current
      );
      setContent('');
    } catch (cause) {
      Alert.alert('Comment not added', cause instanceof Error ? cause.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleLike() {
    if (!post || !id) return;
    const wasLiked = isEnabled(post.liked_by_me);
    setPost({
      ...post,
      liked_by_me: !wasLiked,
      likes_count: Math.max(0, Number(post.likes_count) + (wasLiked ? -1 : 1)),
    });
    try {
      if (!user) throw new Error('Sign in to like posts.');
      const result = await setPostLike(id, user.id, !wasLiked);
      setPost((current) =>
        current ? { ...current, liked_by_me: result.liked, likes_count: result.likes_count } : current
      );
    } catch (cause) {
      setPost(post);
      Alert.alert('Like not saved', cause instanceof Error ? cause.message : 'Please try again.');
    }
  }

  async function reshare() {
    if (!id) return;
    try {
      if (!user) throw new Error('Sign in to reshare posts.');
      await resharePost(id, user.id);
      Alert.alert('Reshared', 'This post has been added to your community feed.');
    } catch (cause) {
      Alert.alert('Reshare not saved', cause instanceof Error ? cause.message : 'Please try again.');
    }
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={palette.green} />
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || 'Post not found.'}</Text>
        <Pressable onPress={() => void loadPost()}>
          <Text style={styles.retry}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={85}>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.content}
        data={comments}
        keyExtractor={(comment) => String(comment.id)}
        ListHeaderComponent={
          <View>
            <View style={styles.postCard}>
              <Text style={styles.author}>@{post.username}</Text>
              <Text style={styles.date}>{formatDate(post.created_at)}</Text>
              {!!post.content && <Text style={styles.postContent}>{post.content}</Text>}
              {post.original_post_id && (
                <View style={styles.original}>
                  <Text style={styles.originalAuthor}>@{post.original_username || 'author'}</Text>
                  <Text style={styles.postContent}>
                    {post.original_content || 'Original post unavailable.'}
                  </Text>
                </View>
              )}
              <View style={styles.actions}>
                <Pressable onPress={() => void toggleLike()}>
                  <Text style={styles.action}>
                    {isEnabled(post.liked_by_me) ? '♥' : '♡'}  {Number(post.likes_count)} likes
                  </Text>
                </Pressable>
                <Pressable onPress={() => void reshare()}>
                  <Text style={styles.action}>↻  Reshare</Text>
                </Pressable>
              </View>
            </View>
            <Text style={styles.commentsTitle}>Conversation</Text>
            <View style={styles.composer}>
              <Text style={styles.composerLabel}>Replying as {user?.username}</Text>
              <Field
                maxLength={5000}
                multiline
                onChangeText={setContent}
                placeholder="Add to the conversation…"
                value={content}
              />
              <Button
                title="Add comment"
                onPress={() => void submitComment()}
                disabled={!content.trim()}
                loading={submitting}
              />
            </View>
            {comments.length === 0 && (
              <Text style={styles.empty}>No comments yet. Start the conversation.</Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.comment}>
            <Text style={styles.commentAuthor}>{item.username}</Text>
            <Text style={styles.commentContent}>{item.content}</Text>
            <Text style={styles.date}>{formatDate(item.created_at)}</Text>
          </View>
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  list: { flex: 1, backgroundColor: palette.background },
  content: { padding: 18, paddingBottom: 30 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background },
  center: {
    flex: 1,
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.background,
    gap: 12,
  },
  error: { color: palette.danger, fontSize: 15, textAlign: 'center' },
  retry: { color: palette.green, fontSize: 15, fontWeight: '700' },
  postCard: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 19,
  },
  author: { color: palette.green, fontSize: 15, fontWeight: '800' },
  date: { color: palette.muted, fontSize: 12, marginTop: 4 },
  postContent: { color: palette.ink, fontSize: 17, lineHeight: 26, marginTop: 17 },
  original: {
    backgroundColor: '#F8F8F5',
    borderLeftWidth: 3,
    borderLeftColor: palette.green,
    padding: 12,
    marginTop: 14,
    borderRadius: 8,
  },
  originalAuthor: { color: palette.green, fontWeight: '700', fontSize: 13 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: palette.line,
    marginTop: 18,
    paddingTop: 13,
  },
  action: { color: palette.muted, fontSize: 14, fontWeight: '700' },
  commentsTitle: { color: palette.ink, fontSize: 21, fontWeight: '800', marginTop: 24, marginBottom: 12 },
  empty: { color: palette.muted, fontSize: 14, paddingVertical: 10 },
  comment: {
    padding: 15,
    marginBottom: 10,
    backgroundColor: palette.surface,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: palette.line,
  },
  commentAuthor: { color: palette.ink, fontSize: 14, fontWeight: '700' },
  commentContent: { color: palette.ink, fontSize: 15, lineHeight: 22, marginTop: 6 },
  composer: { marginTop: 18 },
  composerLabel: { color: palette.muted, fontSize: 13, fontWeight: '600', marginBottom: 10 },
});
