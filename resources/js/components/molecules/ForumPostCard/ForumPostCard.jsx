import React from 'react';
import Avatar from '../../atoms/Avatar';
import Badge from '../../atoms/Badge';

export default function ForumPostCard({ post, onClick }) {
  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return `${diff}d lalu`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
    return `${Math.floor(diff / 86400)}h lalu`;
  };

  const subjectColor = {
    matematika: 'blue', fisika: 'violet', kimia: 'emerald', biologi: 'orange',
    tps: 'gold', bahasa: 'slate',
  };

  return (
    <div
      onClick={onClick}
      className="group bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-slate-700 rounded-lg p-5 cursor-pointer transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-100 dark:bg-slate-800/60 hover:shadow-lg"
    >
      <div className="flex items-start gap-3">
        <Avatar name={post.user?.name ?? '?'} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{post.user?.name}</span>
            {post.user?.school && <span className="text-xs text-slate-500">{post.user.school}</span>}
            <span className="text-xs text-slate-600">• {timeAgo(post.created_at)}</span>
          </div>

          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge color={subjectColor[post.subject] ?? 'slate'}>{post.subject}</Badge>
            {post.answered_at
              ? <Badge color="emerald">✓ Terjawab</Badge>
              : <Badge color="orange">Menunggu jawaban</Badge>
            }
          </div>

          <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-2 text-sm mb-2">
            {post.title}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-xs line-clamp-2">{post.content}</p>

          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <span>💬 {post.replies_count ?? 0} balasan</span>
            <span>👁 {post.views_count ?? 0} dilihat</span>
            <span>👍 {post.upvotes_count ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
