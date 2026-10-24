import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PostCard } from '@/components/post-card';
import { palette } from '@/components/ui';
import { fetchFeed, isEnabled, resharePost, setPostLike, type Post } from '@/lib/api';
import { useAuth } from '@/context/auth-context';

export default function FeedScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    let active = true;
    void fetchFeed(1, 20, user.id)
      .then((response) => {
        if (!active) return;
        setError('');
        setPosts(response.data);
        setPage(1);
        setHasMore(response.data.length === response.pagination.limit);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : 'Could not load the feed.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      });
    return () => {
      active = false;
    };
  }, [user]);

  const loadFeed = useCallback(async (nextPage: number, replace: boolean) => {
    try {
      if (!user) return;
      const response = await fetchFeed(nextPage, 20, user.id);
      setError('');
      setPosts((current) => (replace ? response.data : [...current, ...response.data]));
      setPage(nextPage);
      setHasMore(response.data.length === response.pagination.limit);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load the feed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  async function toggleLike(post: Post) {
    const wasLiked = isEnabled(post.liked_by_me);
    const postId = String(post.id);
    setPosts((current) =>
      current.map((item) =>
        String(item.id) === postId
          ? {
              ...item,
              liked_by_me: !wasLiked,
              likes_count: Math.max(0, Number(item.likes_count) + (wasLiked ? -1 : 1)),
            }
          : item
      )
    );
    try {
      if (!user) throw new Error('Sign in to like posts.');
      const result = await setPostLike(postId, user.id, !wasLiked);
      setPosts((current) =>
        current.map((item) =>
          String(item.id) === postId
            ? { ...item, liked_by_me: result.liked, likes_count: result.likes_count }
            : item
        )
      );
    } catch (cause) {
      setPosts((current) =>
        current.map((item) =>
          String(item.id) === postId
            ? { ...item, liked_by_me: wasLiked, likes_count: post.likes_count }
            : item
        )
      );
      Alert.alert('Like not saved', cause instanceof Error ? cause.message : 'Please try again.');
    }
  }

  async function reshare(post: Post) {
    try {
      if (!user) throw new Error('Sign in to reshare posts.');
      await resharePost(String(post.id), user.id);
      setRefreshing(true);
      await loadFeed(1, true);
    } catch (cause) {
      Alert.alert('Reshare not saved', cause instanceof Error ? cause.message : 'Please try again.');
    }
  }

  const listHeader = (
    <View style={styles.header}>
      <Text style={styles.kicker}>YOUR DAILY NOTEBOOK</Text>
      <Text style={styles.title}>The feed.</Text>
      <Text style={styles.greeting}>A good thought can start anywhere, {user?.username}.</Text>
      {!!error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => {
            setRefreshing(true);
            void loadFeed(1, true);
          }}>
            <Text style={styles.retry}>Try again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={posts}
      keyExtractor={(post) => String(post.id)}
      renderItem={({ item }) => (
        <PostCard post={item} onLike={() => void toggleLike(item)} onReshare={() => void reshare(item)} />
      )}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={
        !loading && !error ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>A fresh page.</Text>
            <Text style={styles.emptyText}>Be the first to share a thought with the community.</Text>
          </View>
        ) : undefined
      }
      ListFooterComponent={
        loading && !refreshing ? <Text style={styles.loadingText}>Loading posts…</Text> : undefined
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void loadFeed(1, true);
          }}
          tintColor={palette.green}
        />
      }
      onEndReached={() => {
        if (hasMore && !loading && !refreshing && posts.length > 0) {
          setLoading(true);
          void loadFeed(page + 1, false);
        }
      }}
      onEndReachedThreshold={0.5}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: palette.background },
  content: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 24, flexGrow: 1 },
  header: { paddingHorizontal: 2, paddingBottom: 17 },
  kicker: { color: palette.orange, fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },
  title: { color: palette.ink, fontSize: 37, fontWeight: '800', letterSpacing: -1.1, marginTop: 6 },
  greeting: { color: palette.muted, fontSize: 14, marginTop: 5, marginBottom: 12 },
  errorBox: {
    backgroundColor: '#F8EAEA',
    borderRadius: 14,
    padding: 13,
    gap: 8,
  },
  errorText: { color: palette.danger, fontSize: 14, lineHeight: 20 },
  retry: { color: palette.green, fontWeight: '700', fontSize: 14 },
  empty: {
    alignItems: 'center',
    padding: 28,
    backgroundColor: palette.surface,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: 18,
  },
  emptyTitle: { color: palette.ink, fontWeight: '700', fontSize: 18, marginBottom: 6 },
  emptyText: { color: palette.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  loadingText: { color: palette.muted, textAlign: 'center', padding: 16 },
});
