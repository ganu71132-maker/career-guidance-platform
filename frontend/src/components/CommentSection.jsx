import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, Send, Trash2, Edit2, Check, Loader2, AlertCircle } from 'lucide-react';
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
  if (days < 7) {
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  }
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
  
  const years = Math.floor(days / 365);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}

export default function CommentSection({ pageType, pageId }) {
  const { fetchComments, addComment, editComment, deleteComment } = useData();
  const { user } = useAuth();
  
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const MAX_CHARS = 1000;

  useEffect(() => {
    loadComments();
  }, [pageType, pageId]);

  async function loadComments() {
    setLoading(true);
    setError(null);
    const { success, data, error: fetchError } = await fetchComments(pageType, pageId);
    
    if (success) {
      setComments(data);
    } else {
      setError(fetchError || 'Failed to load comments');
    }
    setLoading(false);
  }

  async function handlePostComment(e) {
    e.preventDefault();
    if (!newComment.trim() || newComment.length > MAX_CHARS || !user) return;
    
    setIsSubmitting(true);
    setError(null);
    
    const { success, data, error: postError } = await addComment(pageType, pageId, newComment, user.email);
    
    if (success) {
      setNewComment('');
      // Add immediately to top of list
      setComments(prev => [data, ...prev]);
    } else {
      setError(postError || 'Failed to post comment');
    }
    
    setIsSubmitting(false);
  }

  async function handleDelete(commentId) {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    
    // Optimistic delete
    const prevComments = [...comments];
    setComments(prev => prev.filter(c => c.id !== commentId));
    
    const { success, error: deleteError } = await deleteComment(commentId);
    if (!success) {
      // Revert if failed
      setComments(prevComments);
      alert(deleteError || 'Failed to delete comment');
    }
  }

  function startEdit(comment) {
    setEditingId(comment.id);
    setEditContent(comment.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditContent('');
  }

  async function handleEditSave(commentId) {
    if (!editContent.trim() || editContent.length > MAX_CHARS) return;
    
    setIsEditing(true);
    
    const { success, data, error: editError } = await editComment(commentId, editContent);
    
    if (success) {
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: data.content, updated_at: data.updated_at } : c));
      cancelEdit();
    } else {
      alert(editError || 'Failed to save edit');
    }
    
    setIsEditing(false);
  }

  const getInitials = (email) => {
    if (!email) return '?';
    return email.substring(0, 2).toUpperCase();
  };
  
  const getUsername = (email) => {
    if (!email) return 'Anonymous';
    return email.split('@')[0];
  };

  return (
    <div className="mt-12 md:mt-16 bg-white rounded-3xl p-6 md:p-8 lg:p-10 shadow-sm border border-slate-200/60 w-full">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-indigo-50 rounded-xl">
          <MessageSquare className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Community Discussion</h2>
          <p className="text-sm text-slate-500 mt-1">Read discussions and share your knowledge.</p>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 border border-red-100">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Input Area (Logged In vs Guest) */}
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
            <Link to="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm shadow-indigo-600/20">
              Log In to Discuss
            </Link>
          </div>
        )}
      </div>

      {/* Comments List */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center justify-between">
          <span>{comments.length} Comment{comments.length !== 1 ? 's' : ''}</span>
        </h3>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin mb-3 text-indigo-500" />
            <p className="text-sm font-medium">Loading discussions...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-3xl">
            <div className="text-4xl mb-3">💬</div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">No discussions yet</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">Be the first person to ask a question or share your experience about this topic.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="group flex gap-4 p-5 rounded-2xl border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/50 transition-colors shadow-sm hover:shadow">
                
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-inner">
                  {getInitials(comment.user_email)}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800 text-sm">
                        {getUsername(comment.user_email)}
                      </span>
                      {comment.user_id === user?.id && (
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">You</span>
                      )}
                      <span className="text-slate-400 text-xs">
                        • {timeAgo(comment.created_at)}
                      </span>
                      {comment.updated_at !== comment.created_at && (
                        <span className="text-slate-400 text-[10px] italic">
                          (edited)
                        </span>
                      )}
                    </div>
                    
                    {/* Actions Menu */}
                    {comment.user_id === user?.id && editingId !== comment.id && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(comment)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(comment.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Edit Mode vs Read Mode */}
                  {editingId === comment.id ? (
                    <div className="mt-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-white border border-indigo-200 rounded-xl p-3 resize-y min-h-[80px] text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                        maxLength={MAX_CHARS}
                        autoFocus
                      />
                      <div className="flex items-center justify-end gap-2 mt-2">
                        <button 
                          onClick={cancelEdit}
                          disabled={isEditing}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleEditSave(comment.id)}
                          disabled={!editContent.trim() || isEditing}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                        >
                          {isEditing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-600 text-sm whitespace-pre-wrap break-words leading-relaxed mt-1">
                      {comment.content}
                    </p>
                  )}
                </div>
                
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
