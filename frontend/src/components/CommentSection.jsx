import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, Send, Trash2, Edit2, Check, Loader2, AlertCircle, CornerDownRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? 'Yesterday' : `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}

const getInitials = (email) => (!email ? '?' : email.substring(0, 2).toUpperCase());
const getUsername = (email) => (!email ? 'Anonymous' : email.split('@')[0]);

const MAX_CHARS = 1000;

// ─── Reply Input Box ──────────────────────────────────────────────────────────
function ReplyInput({ onSubmit, onCancel, placeholder = 'Write a reply...' }) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    await onSubmit(text);
    setText('');
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 ml-1">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        autoFocus
        maxLength={MAX_CHARS}
        className="w-full bg-white border border-indigo-200 rounded-xl p-3 resize-none min-h-[80px] text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
      />
      <div className="flex items-center justify-between mt-2">
        <span className={`text-[11px] font-medium ${text.length > MAX_CHARS * 0.9 ? 'text-orange-500' : 'text-slate-400'}`}>
          {text.length}/{MAX_CHARS}
        </span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!text.trim() || submitting}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg transition-colors"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Reply
          </button>
        </div>
      </div>
    </form>
  );
}

// ─── Single Comment Card ───────────────────────────────────────────────────────
function CommentCard({ comment, replies = [], user, onReply, onDelete, onEdit, depth = 0 }) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const isOwn = comment.user_id === user?.id;

  async function handleEditSave() {
    if (!editContent.trim()) return;
    setIsEditing(true);
    await onEdit(comment.id, editContent);
    setEditingId(null);
    setIsEditing(false);
  }

  function startEdit() {
    setEditingId(comment.id);
    setEditContent(comment.content);
  }

  return (
    <div className={depth > 0 ? 'ml-8 mt-3 border-l-2 border-indigo-100 pl-4' : ''}>
      <div className="group flex gap-3 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/40 transition-colors shadow-sm">
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
          style={{ background: depth > 0 ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'linear-gradient(135deg,#6366f1,#a855f7)' }}
        >
          {getInitials(comment.user_email)}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-800 text-sm">{getUsername(comment.user_email)}</span>
              {isOwn && (
                <span className="bg-emerald-100 text-emerald-700 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">You</span>
              )}
              <span className="text-slate-400 text-xs">• {timeAgo(comment.created_at)}</span>
              {comment.updated_at !== comment.created_at && (
                <span className="text-slate-400 text-[10px] italic">(edited)</span>
              )}
            </div>

            {/* Owner Actions */}
            {isOwn && editingId !== comment.id && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={startEdit} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => onDelete(comment.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Content / Edit */}
          {editingId === comment.id ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-white border border-indigo-200 rounded-xl p-3 resize-y min-h-[70px] text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                autoFocus
                maxLength={MAX_CHARS}
              />
              <div className="flex items-center justify-end gap-2 mt-1.5">
                <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button
                  onClick={handleEditSave}
                  disabled={!editContent.trim() || isEditing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  {isEditing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-600 text-sm whitespace-pre-wrap break-words leading-relaxed mt-1">{comment.content}</p>
          )}

          {/* Footer actions */}
          <div className="flex items-center gap-4 mt-2">
            {user && depth === 0 && (
              <button
                onClick={() => setShowReplyInput((v) => !v)}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors"
              >
                <CornerDownRight className="h-3.5 w-3.5" />
                {showReplyInput ? 'Cancel' : 'Reply'}
              </button>
            )}
            {replies.length > 0 && (
              <button
                onClick={() => setShowReplies((v) => !v)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showReplies ? `Hide ${replies.length} repl${replies.length !== 1 ? 'ies' : 'y'}` : `Show ${replies.length} repl${replies.length !== 1 ? 'ies' : 'y'}`}
              </button>
            )}
          </div>

          {/* Reply Input */}
          {showReplyInput && (
            <ReplyInput
              onSubmit={async (text) => { await onReply(comment.id, text); setShowReplyInput(false); }}
              onCancel={() => setShowReplyInput(false)}
            />
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {showReplies && replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              replies={[]}
              user={user}
              onReply={onReply}
              onDelete={onDelete}
              onEdit={onEdit}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Comment Section ──────────────────────────────────────────────────────
export default function CommentSection({ pageType, pageId }) {
  const { fetchComments, addComment, editComment, deleteComment } = useData();
  const { user } = useAuth();

  const [allComments, setAllComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { loadComments(); }, [pageType, pageId]);

  async function loadComments() {
    setLoading(true);
    setError(null);
    const { success, data, error: fetchError } = await fetchComments(pageType, pageId);
    if (success) setAllComments(data);
    else setError(fetchError || 'Failed to load comments');
    setLoading(false);
  }

  // Separate top-level comments from replies
  const topLevel = allComments.filter((c) => !c.parent_id);
  const getReplies = (parentId) => allComments.filter((c) => c.parent_id === parentId);

  async function handlePostComment(e) {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    setIsSubmitting(true);
    setError(null);
    const { success, data, error: postError } = await addComment(pageType, pageId, newComment, user.email, null);
    if (success) {
      setNewComment('');
      setAllComments((prev) => [data, ...prev]);
    } else setError(postError || 'Failed to post comment');
    setIsSubmitting(false);
  }

  async function handleReply(parentId, content) {
    if (!user) return;
    const { success, data, error: postError } = await addComment(pageType, pageId, content, user.email, parentId);
    if (success) setAllComments((prev) => [...prev, data]);
    else alert(postError || 'Failed to post reply');
  }

  async function handleDelete(commentId) {
    if (!window.confirm('Are you sure you want to delete this?')) return;
    const prev = [...allComments];
    // Also remove all its replies from state
    setAllComments((c) => c.filter((x) => x.id !== commentId && x.parent_id !== commentId));
    const { success, error: deleteError } = await deleteComment(commentId);
    if (!success) { setAllComments(prev); alert(deleteError || 'Failed to delete'); }
  }

  async function handleEdit(commentId, content) {
    const { success, data, error: editError } = await editComment(commentId, content);
    if (success) setAllComments((prev) => prev.map((c) => c.id === commentId ? { ...c, content: data.content, updated_at: data.updated_at } : c));
    else alert(editError || 'Failed to edit');
  }

  return (
    <div className="mt-12 md:mt-16 bg-white rounded-3xl p-6 md:p-8 lg:p-10 shadow-sm border border-slate-200/60 w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-indigo-50 rounded-xl">
          <MessageSquare className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Community Discussion</h2>
          <p className="text-sm text-slate-500 mt-0.5">Ask questions, share knowledge, and help each other.</p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 border border-red-100">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* New Comment Input */}
      <div className="mb-10">
        {user ? (
          <form onSubmit={handlePostComment} className="bg-slate-50/50 rounded-2xl p-4 border border-slate-200">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Ask a question or share your experience..."
              className="w-full bg-transparent resize-none outline-none min-h-[100px] text-slate-700 text-base"
              maxLength={MAX_CHARS}
            />
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200/60">
              <span className={`text-xs font-medium ${newComment.length > MAX_CHARS * 0.9 ? 'text-orange-500' : 'text-slate-400'}`}>
                {newComment.length} / {MAX_CHARS}
              </span>
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Post
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-indigo-50/50 rounded-2xl p-8 border border-indigo-100 text-center flex flex-col items-center">
            <MessageSquare className="h-8 w-8 text-indigo-400 mb-3 opacity-50" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">Join the conversation</h3>
            <p className="text-slate-500 text-sm mb-5">Please log in to ask questions or reply to others.</p>
            <Link to="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm">
              Log In to Discuss
            </Link>
          </div>
        )}
      </div>

      {/* Comments */}
      <div>
        <h3 className="text-base font-bold text-slate-700 mb-5">
          {topLevel.length} Discussion{topLevel.length !== 1 ? 's' : ''}
          {allComments.length > topLevel.length && (
            <span className="ml-2 text-slate-400 font-normal text-sm">
              · {allComments.length - topLevel.length} repl{allComments.length - topLevel.length !== 1 ? 'ies' : 'y'}
            </span>
          )}
        </h3>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin mb-3 text-indigo-500" />
            <p className="text-sm font-medium">Loading discussions...</p>
          </div>
        ) : topLevel.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-3xl">
            <div className="text-4xl mb-3">💬</div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">No discussions yet</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">Be the first person to ask a question or share your experience about this topic.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topLevel.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                replies={getReplies(comment.id)}
                user={user}
                onReply={handleReply}
                onDelete={handleDelete}
                onEdit={handleEdit}
                depth={0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
