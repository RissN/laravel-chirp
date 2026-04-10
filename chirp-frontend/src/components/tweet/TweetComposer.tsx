import React, { useState } from 'react';
import { Image, Smile, Plus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { useAuthStore } from '../../store/authStore';
import { createTweet, replyToTweet } from '../../api/tweets';
import { useToast } from '../ui/ToastProvider';
import api from '../../api/axios';

export default function TweetComposer({ isReply = false, parentId }: { isReply?: boolean, parentId?: number }) {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const tweetMutation = useMutation({
    mutationFn: (data: {content?: string, media?: string[]}) => {
      if (isReply && parentId) {
        return replyToTweet(parentId, data);
      }
      return createTweet(data);
    },
    onSuccess: () => {
      setContent('');
      setImages([]);
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      if (isReply) queryClient.invalidateQueries({ queryKey: ['replies', parentId] });
      showToast(isReply ? 'Reply sent' : 'Sent!', 'success');
    },
    onError: () => {
      showToast('Failed to post tweet', 'error');
    }
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).slice(0, 4 - images.length);
      setImages([...images, ...filesArray]);
    }
  };

  const handlePost = async () => {
    if (!content.trim() && images.length === 0) return;

    setIsUploading(true);
    let uploadedMediaUrls: string[] = [];

    // Upload media sequentially
    try {
      for (const file of images) {
        const formData = new FormData();
        formData.append('media', file);
        formData.append('type', 'tweet');
        
        const res = await api.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedMediaUrls.push(res.data.data.url);
      }

      tweetMutation.mutate({
        content: content.trim(),
        media: uploadedMediaUrls.length > 0 ? uploadedMediaUrls : undefined
      });
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  const charCount = content.length;
  const isOverLimit = charCount > 280;
  const isNearLimit = charCount >= 260;
  const isDisabled = isOverLimit || (!content.trim() && images.length === 0) || tweetMutation.isPending || isUploading;

  if (!user) return null;

  return (
    <div className={`p-4 border-b border-[var(--border-color)]/30 ${isReply ? '' : 'animate-fade-in'}`}>
      <div className="flex gap-4">
        <Avatar name={user?.name || 'User'} src={user?.avatar} size="md" linkToProfile={false} />
        
        <div className="flex-1 min-w-0">
          <textarea
            className="w-full bg-transparent border-none text-[18px] text-[var(--text-color)] placeholder:text-[var(--text-muted)] focus:ring-0 resize-none min-h-[50px] py-1 leading-tight outline-none"
            placeholder={isReply ? "Post your reply" : "What is happening?!"}
            rows={Math.max(1, content.split('\n').length)}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          {/* Image Previews */}
          {images.length > 0 && (
            <div className={`mt-3 grid gap-2 rounded-2xl overflow-hidden border border-[var(--border-color)]/30 ${
              images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
            }`}>
              {images.map((file, i) => (
                <div key={i} className="relative group/img aspect-video sm:aspect-square overflow-hidden">
                  <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" />
                  <button 
                    onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-sm"
                  >
                    <Plus size={16} className="rotate-45" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-color)]/10">
            <div className="flex items-center -ml-2">
              <label className="p-2.5 rounded-full text-[var(--color-chirp)] hover:bg-[var(--color-chirp)]/10 cursor-pointer transition-colors group/tool relative">
                <Image size={20} strokeWidth={2.5} />
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} disabled={images.length >= 4} />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover/tool:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">Media</span>
              </label>
              <button className="p-2.5 rounded-full text-[var(--color-chirp)] hover:bg-[var(--color-chirp)]/10 transition-colors group/tool relative">
                <Smile size={20} strokeWidth={2.5} />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover/tool:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">Emoji</span>
              </button>
            </div>

            <div className="flex items-center gap-4">
              {charCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className={`w-1 h-8 rounded-full ${isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-[var(--color-chirp)]/30'}`} />
                  <span className={`text-[12px] font-bold ${isOverLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-500' : 'text-[var(--text-muted)]'}`}>
                    {280 - charCount}
                  </span>
                </div>
              )}
              <Button 
                onClick={handlePost} 
                disabled={isDisabled}
                isLoading={tweetMutation.isPending || isUploading}
                size="sm"
                className="px-6 py-2 shadow-md hover:shadow-lg active:scale-95 transition-all font-bold tracking-wide"
              >
                {isReply ? 'Reply' : 'Post'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
