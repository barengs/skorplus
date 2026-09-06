import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPosts } from '../../../features/forum/forumSlice';
import ForumPostCard from '../../molecules/ForumPostCard';

export default function ForumList({ filter, search, onPostClick }) {
  const dispatch = useDispatch();
  const { posts, loading, error } = useSelector((s) => s.forum);

  useEffect(() => {
    dispatch(fetchPosts({ subject: filter, search }));
  }, [dispatch, filter, search]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-800/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-slate-500">
        <div className="text-4xl mb-3">😕</div>
        <p>{error}</p>
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="text-center py-12 text-slate-500">
        <div className="text-4xl mb-3">💬</div>
        <p>Belum ada pertanyaan. Jadilah yang pertama bertanya!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {posts.map((post) => (
        <ForumPostCard key={post.id} post={post} onClick={() => onPostClick?.(post)} />
      ))}
    </div>
  );
}
