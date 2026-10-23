import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text } from 'react-native';

import { Button, Field, Heading, Page, palette } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api';

export default function CreatePostScreen() {
  const { token } = useAuth();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const text = content.trim();
    if (!text) {
      Alert.alert('Add a thought', 'Write something before publishing your post.');
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest('/posts', {
        method: 'POST',
        body: JSON.stringify({ content: text }),
      }, token);
      setContent('');
      router.replace('/(tabs)');
    } catch (cause) {
      Alert.alert('Post not published', cause instanceof Error ? cause.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Page>
        <Text style={styles.kicker}>PUT IT INTO WORDS</Text>
        <Heading>Write a post.</Heading>
        <Text style={styles.helper}>What’s on your mind? Your community is listening.</Text>
        <Field
          autoFocus
          maxLength={10000}
          multiline
          onChangeText={setContent}
          placeholder="Start with a thought…"
          textAlignVertical="top"
          value={content}
        />
        <Text style={styles.count}>{content.length.toLocaleString()} / 10,000</Text>
        <Button
          title="Publish post"
          onPress={() => void submit()}
          loading={submitting}
          disabled={!content.trim()}
        />
      </Page>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  kicker: {
    color: palette.orange,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginTop: 20,
    marginBottom: 7,
  },
  helper: { color: palette.muted, fontSize: 15, lineHeight: 22, marginTop: -9, marginBottom: 18 },
  count: { color: palette.muted, fontSize: 12, textAlign: 'right', marginTop: -4, marginBottom: 18 },
});
