import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../../services/api';
import Avatar from '../../atoms/Avatar';
import Badge from '../../atoms/Badge';
import Button from '../../atoms/Button';
import AppLayout from '../../templates/AppLayout';

export default function ForumDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [replyContent, setReplyContent] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [submittingReply, setSubmittingReply] = useState(false);

  const replyBoxRef = useRef(null);
  const textareaRef = useRef(null);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/forum/posts/${id}`);
      setPost(res.data.post);
    } catch (err) {
      console.error('Failed to load forum post:', err);
      setError(err.response?.data?.message || 'Gagal memuat detail forum.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPost();
    }
  }, [id]);

  const timeAgo = (date) => {
    if (!date) return '';
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return `${diff}d lalu`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
    return `${Math.floor(diff / 86400)}h lalu`;
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const handleStartReply = (targetReply = null) => {
    if (targetReply) {
      setReplyTo({
        id: targetReply.id,
        name: targetReply.user?.name || 'Pengguna',
      });
    } else {
      setReplyTo(null);
    }

    if (replyBoxRef.current) {
      replyBoxRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 300);
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyContent || replyContent.trim().length < 3) {
      toast.warn('Isi balasan minimal 3 karakter.');
      return;
    }

    try {
      setSubmittingReply(true);
      const payload = {
        content: replyContent.trim(),
        parent_id: replyTo?.id || null,
      };

      const res = await api.post(`/forum/posts/${id}/reply`, payload);
      const newReply = res.data.reply;

      toast.success('Balasan berhasil dikirim!');
      setReplyContent('');
      setReplyTo(null);

      // Append new reply locally
      setPost((prev) => {
        if (!prev) return prev;
        const updatedReplies = [...(prev.replies || []), newReply];
        return {
          ...prev,
          replies: updatedReplies,
          replies_count: (prev.replies_count || 0) + 1,
          answered_at: newReply.is_tutor_answer ? new Date().toISOString() : prev.answered_at,
        };
      });
    } catch (err) {
      console.error('Failed to submit reply:', err);
      toast.error(err.response?.data?.message || 'Gagal mengirim balasan.');
    } finally {
      setSubmittingReply(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Detil Diskusi Forum">
        <div className="max-w-3xl mx-auto flex flex-col gap-6 animate-pulse">
          <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
      </AppLayout>
    );
  }

  if (error || !post) {
    return (
      <AppLayout title="Detil Diskusi Forum">
        <div className="max-w-3xl mx-auto text-center py-16">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Topik Tidak Ditemukan</h2>
          <p className="text-slate-500 mb-6">{error || 'Pertanyaan atau diskusi ini mungkin telah dihapus.'}</p>
          <Link to="/forum">
            <Button variant="primary">← Kembali ke Forum</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const replies = post.replies || [];

  return (
    <AppLayout title={post.title || 'Detil Diskusi Forum'}>
      <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-12">
        {/* Navigation Breadcrumb / Back button */}
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/forum"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Kembali ke Forum Diskusi</span>
          </Link>

          <Button
            size="sm"
            onClick={() => handleStartReply(null)}
            className="flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            <span>Balas Topik</span>
          </Button>
        </div>

        {/* Main Topic Question Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-7 shadow-xs flex flex-col gap-5 text-left">
          {/* Header Badges & Stats */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge color={getSubjectColor(post.subject)}>{post.subject}</Badge>
              {post.answered_at ? (
                <Badge color="emerald">✓ Terjawab</Badge>
              ) : (
                <Badge color="orange">Menunggu jawaban</Badge>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>{post.views_count ?? 0} dilihat</span>
              </span>

              <span className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{post.replies_count ?? replies.length} Diskusi</span>
              </span>
            </div>
          </div>

          {/* Topic Title */}
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 leading-snug">
              {post.title}
            </h1>
          </div>

          {/* Author info & timestamp */}
          <div className="flex items-center gap-3 py-2 border-y border-slate-100 dark:border-slate-800">
            <Avatar name={post.user?.name ?? '?'} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  {post.user?.name ?? 'Siswa SkorPluss'}
                </span>
                {post.user?.school && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    • {post.user.school}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Ditanyakan pada {formatDate(post.created_at)} ({timeAgo(post.created_at)})
              </p>
            </div>
          </div>

          {/* Question / Topic Content */}
          <div className="text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>
        </div>

        {/* Discussions & Replies Thread */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Diskusi & Balasan</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-bold">
                {replies.length}
              </span>
            </h2>
          </div>

          {replies.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-10 text-center text-slate-500 dark:text-slate-400">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-sm font-medium mb-2">Belum ada diskusi atau jawaban untuk topik ini.</p>
              <p className="text-xs text-slate-400 mb-4">
                Bantu temanmu atau ajukan pertanyaan tambahan melalui formulir di bawah.
              </p>
              <Button size="sm" onClick={() => handleStartReply(null)}>
                Tulis Balasan Pertama
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {replies.map((reply) => (
                <div
                  key={reply.id}
                  className={`bg-white dark:bg-slate-900 border rounded-lg p-5 transition-all text-left flex flex-col gap-3 ${
                    reply.is_tutor_answer
                      ? 'border-emerald-500/40 bg-emerald-500/[0.02] dark:bg-emerald-950/10'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Reply Author Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={reply.user?.name ?? '?'} size="sm" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                            {reply.user?.name ?? 'Pengguna'}
                          </span>
                          {reply.is_tutor_answer && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              <span>✓ Tutor SkorPluss</span>
                            </span>
                          )}
                          {reply.user?.school && !reply.is_tutor_answer && (
                            <span className="text-xs text-slate-400 truncate max-w-[150px]">
                              • {reply.user.school}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {timeAgo(reply.created_at)} • {formatDate(reply.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Tombol Replay / Balas pada setiap diskusi */}
                    <button
                      type="button"
                      onClick={() => handleStartReply(reply)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800/60 transition-colors cursor-pointer shrink-0"
                      title={`Balas komentar dari ${reply.user?.name || 'pengguna ini'}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      <span>Balas</span>
                    </button>
                  </div>

                  {/* Context: Replying to someone */}
                  {reply.parent && reply.parent.user && (
                    <div className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800/70 px-2.5 py-1 rounded w-fit">
                      <span className="text-slate-400">Membalas</span>
                      <strong className="text-blue-600 dark:text-blue-400">@{reply.parent.user.name}</strong>
                    </div>
                  )}

                  {/* Reply Content */}
                  <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap pl-1">
                    {reply.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reply Form Box */}
        <div
          ref={replyBoxRef}
          className="bg-white dark:bg-slate-900 border border-blue-500/20 rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-3 text-left"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
              {replyTo ? `Balas Diskusi @${replyTo.name}` : 'Tulis Balasan / Tanggapan'}
            </h3>
            {replyTo && (
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
              >
                ✕ Batal Balas @{replyTo.name}
              </button>
            )}
          </div>

          {replyTo && (
            <div className="flex items-center justify-between text-xs bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-md">
              <span>Kamu sedang membalas komentar dari <strong>{replyTo.name}</strong></span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm leading-none ml-2"
              >
                ✕
              </button>
            </div>
          )}

          <form onSubmit={handleSendReply} className="flex flex-col gap-3">
            <textarea
              ref={textareaRef}
              rows={4}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={
                replyTo
                  ? `Tulis balasan untuk ${replyTo.name}...`
                  : 'Tulis solusi, penjelasan, atau pertanyaan lanjutan untuk topik ini...'
              }
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none resize-none"
            />

            <div className="flex items-center justify-between gap-4 pt-1">
              <span className="text-xs text-slate-400">
                Tekan tombol kirim untuk mempublikasikan balasanmu.
              </span>
              <Button
                type="submit"
                loading={submittingReply}
                className="flex items-center gap-1.5"
              >
                <span>Kirim Balasan</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
