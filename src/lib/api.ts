import { getSupabase } from '@/lib/supabase';

export type User = {
  id: string;
  username: string;
  email: string;
  created_at: string;
};

export type Post = {
  id: number;
  user_id: string;
  username: string;
  content: string | null;
  is_reshare: boolean;
  original_post_id: number | null;
  created_at: string;
  original_content: string | null;
  original_created_at: string | null;
  original_user_id: string | null;
  original_username: string | null;
  likes_count: number;
  comments_count: number;
  liked_by_me: boolean;
};

export type Comment = {
  id: number;
  post_id: number;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type FeedRow = {
  id: number;
  user_id: string;
  content: string | null;
  is_reshare: boolean;
  original_post_id: number | null;
  created_at: string;
  author: { username: string };
  likes: { count: number }[];
  comments: { count: number }[];
  my_likes: { id: number }[];
};

type OriginalPostRow = {
  id: number;
  user_id: string;
  content: string | null;
  created_at: string;
  author: { username: string };
};

type CommentRow = {
  id: number;
  post_id: number;
  user_id: string;
  content: string;
  created_at: string;
  author: { username: string };
};

const postSelect = [
  'id',
  'user_id',
  'content',
  'is_reshare',
  'original_post_id',
  'created_at',
  'author:profiles!posts_user_id_fkey(username)',
  'likes(count)',
  'my_likes:likes!likes_post_id_fkey(id)',
  'comments(count)',
].join(',');

function raiseIfError(error: { message: string; code?: string } | null): void {
  if (error) {
    throw new ApiError(error.message, error.code === 'PGRST116' ? 404 : 0);
  }
}

function toPost(row: FeedRow, original?: OriginalPostRow): Post {
  return {
    id: row.id,
    user_id: row.user_id,
    username: row.author.username,
    content: row.content,
    is_reshare: row.is_reshare,
    original_post_id: row.original_post_id,
    created_at: row.created_at,
    original_content: original?.content ?? null,
    original_created_at: original?.created_at ?? null,
    original_user_id: original?.user_id ?? null,
    original_username: original?.author.username ?? null,
    likes_count: row.likes[0]?.count ?? 0,
    comments_count: row.comments[0]?.count ?? 0,
    liked_by_me: row.my_likes.length > 0,
  };
}

async function withOriginalPosts(rows: FeedRow[]): Promise<Post[]> {
  const originalIds = [
    ...new Set(
      rows
        .map((row) => row.original_post_id)
        .filter((id): id is number => id !== null)
    ),
  ];
  let originals = new Map<number, OriginalPostRow>();

  if (originalIds.length > 0) {
    const { data, error } = await getSupabase()
      .from('posts')
      .select('id,user_id,content,created_at,author:profiles!posts_user_id_fkey(username)')
      .in('id', originalIds);
    raiseIfError(error);
    originals = new Map(
      (data as unknown as OriginalPostRow[]).map((post) => [post.id, post])
    );
  }

  return rows.map((row) =>
    toPost(
      row,
      row.original_post_id === null ? undefined : originals.get(row.original_post_id)
    )
  );
}

function toComment(row: CommentRow): Comment {
  return {
    id: row.id,
    post_id: row.post_id,
    user_id: row.user_id,
    username: row.author.username,
    content: row.content,
    created_at: row.created_at,
  };
}

export async function fetchFeed(
  page: number,
  limit: number,
  viewerId: string
): Promise<{ data: Post[]; pagination: { page: number; limit: number } }> {
  const { data, error } = await getSupabase()
    .from('posts')
    .select(postSelect)
    .eq('my_likes.user_id', viewerId)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  raiseIfError(error);
  return {
    data: await withOriginalPosts(data as unknown as FeedRow[]),
    pagination: { page, limit },
  };
}

export async function fetchPost(id: string, viewerId: string): Promise<{ data: Post }> {
  const { data, error } = await getSupabase()
    .from('posts')
    .select(postSelect)
    .eq('id', id)
    .eq('my_likes.user_id', viewerId)
    .maybeSingle();
  raiseIfError(error);
  if (!data) throw new ApiError('Post not found.', 404);
  return { data: (await withOriginalPosts([data as unknown as FeedRow]))[0] };
}

export async function fetchComments(
  postId: string,
  page = 1,
  limit = 50
): Promise<{ data: Comment[]; pagination: { page: number; limit: number } }> {
  const { data, error } = await getSupabase()
    .from('comments')
    .select('id,post_id,user_id,content,created_at,author:profiles!comments_user_id_fkey(username)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
    .range((page - 1) * limit, page * limit - 1);
  raiseIfError(error);
  return {
    data: (data as unknown as CommentRow[]).map(toComment),
    pagination: { page, limit },
  };
}

export async function createPost(content: string, userId: string): Promise<void> {
  const { error } = await getSupabase().from('posts').insert({
    user_id: userId,
    content,
  });
  raiseIfError(error);
}

export async function createComment(
  postId: string,
  userId: string,
  content: string
): Promise<{ data: Comment }> {
  const { data, error } = await getSupabase()
    .from('comments')
    .insert({ post_id: postId, user_id: userId, content })
    .select('id,post_id,user_id,content,created_at,author:profiles!comments_user_id_fkey(username)')
    .single();
  raiseIfError(error);
  return { data: toComment(data as unknown as CommentRow) };
}

export async function setPostLike(
  postId: string,
  userId: string,
  liked: boolean
): Promise<{ liked: boolean; likes_count: number }> {
  const supabase = getSupabase();
  if (liked) {
    const { error } = await supabase
      .from('likes')
      .upsert({ post_id: postId, user_id: userId }, { onConflict: 'post_id,user_id', ignoreDuplicates: true });
    raiseIfError(error);
  } else {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
    raiseIfError(error);
  }

  const { count, error } = await supabase
    .from('likes')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', postId);
  raiseIfError(error);
  return { liked, likes_count: count ?? 0 };
}

export async function resharePost(postId: string, userId: string): Promise<void> {
  const supabase = getSupabase();
  const { data: source, error: sourceError } = await supabase
    .from('posts')
    .select('id,original_post_id')
    .eq('id', postId)
    .single();
  raiseIfError(sourceError);
  if (!source) throw new ApiError('Post not found.', 404);
  const { error } = await supabase.from('posts').insert({
    user_id: userId,
    is_reshare: true,
    original_post_id: source.original_post_id ?? source.id,
  });
  raiseIfError(error);
}

export function isEnabled(value: boolean | number | string | null | undefined): boolean {
  return value === true || value === 1 || value === '1';
}

export function formatDate(value: string): string {
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
