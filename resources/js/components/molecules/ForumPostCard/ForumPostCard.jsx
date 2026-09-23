import React from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../../atoms/Avatar';
import Badge from '../../atoms/Badge';

export default function ForumPostCard({ post, onClick }) {
  const navigate = useNavigate();

  const timeAgo = (date) => {
    if (!date) return '';
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return `${diff}d lalu`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
    return `${Math.floor(diff / 86400)}h lalu`;
  };

  const getSubjectColor = (subject) => {
    if (!subject) return 'blue';
    const s = subject.toLowerCase();
    if (s.includes('matematika') || s.includes('pm')) return 'blue';
    if (s.includes('tps') || s.includes('penalaran')) return 'gold';
    if (s.includes('python') || s.includes('coding') || s.includes('developer')) return 'emerald';
    if (s.includes('ai') || s.includes('claude') || s.includes('n8n')) return 'violet';
    if (s.includes('marketing') || s.includes('copywriting')) return 'orange';
    if (s.includes('data') || s.includes('excel')) return 'blue';
    return 'slate';
  };

  const handleClick = () => {
    if (onClick) {
      onClick(post);
    } else {
      navigate(`/forum/${post.id}`);
    }
  };

  const repliesCount = post.replies_count ?? post.replies?.length ?? 0;

  return (
    <div
      onClick={handleClick}
      className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 rounded-lg p-5 cursor-pointer transition-all duration-200 shadow-xs hover:shadow-md flex flex-col gap-3 text-left"
    >
      {/* Top Header: Category & Status Badge + Waktu & Jumlah Diskusi */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge color={getSubjectColor(post.subject)}>{post.subject}</Badge>
          {post.answered_at ? (
            <Badge color="emerald">✓ Terjawab</Badge>
          ) : (
            <Badge color="orange">Menunggu jawaban</Badge>
          )}
        </div>

        {/* Waktu & Jumlah Diskusi */}
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <span className="inline-flex items-center gap-1 font-medium">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{timeAgo(post.created_at)}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-xs border border-blue-100 dark:border-blue-800/50">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{repliesCount} Diskusi</span>
          </span>
        </div>
      </div>

      {/* Main Topic Title (Judul) & Excerpt */}
      <div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm line-clamp-2 mt-1 leading-relaxed">
          {post.content}
        </p>
      </div>

      {/* Footer: User Info & CTA */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 flex-wrap gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar name={post.user?.name ?? '?'} size="sm" />
          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
            {post.user?.name ?? 'Siswa'}
          </span>
          {post.user?.school && (
            <span className="text-slate-400 truncate max-w-[160px] hidden sm:inline">
              • {post.user.school}
            </span>
          )}
        </div>

        <span className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform text-xs">
          <span>Buka Diskusi</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </div>
  );
}
