import React, { useState } from 'react';
import { Image, Smile, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { useAuthStore } from '../../store/authStore';
import { createTweet } from '../../api/tweets';
import api from '../../api/axios';

export default function TweetComposer({ isReply = false, parentId }: { isReply?: boolean, parentId?: number }) {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const tweetMutation = useMutation({
    mutationFn: (data: {content?: string, media?: string[]}) => createTweet(data),
    onSuccess: () => {
      setContent('');
      setImages([]);
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      if (isReply) queryClient.invalidateQueries({ queryKey: ['replies', parentId] });
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
    <div className="flex gap-4 p-4 border-b border-[var(--border-color)]">
      <Avatar name={user.name} src={user.avatar} size="md" linkToProfile={false} />
      
      <div className="flex-1">
        <textarea
          className="w-full bg-transparent text-xl text-[var(--text-color)] placeholder:text-[var(--text-muted)] border-none resize-none focus:ring-0 px-0 outline-none"
          placeholder={isReply ? "Post your reply" : "What is happening?!"}
          rows={Math.max(1, content.split('\n').length)}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {images.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-3 mt-2">
            {images.map((img, i) => (
              <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden">
                <img src={URL.createObjectURL(img)} alt="upload preview" className="w-full h-full object-cover" />
                <button 
                  onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white hover:bg-black/80"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-[var(--border-color)] pt-3 mt-2 flex justify-between items-center">
          <div className="flex gap-2 text-[var(--color-chirp)]">
            <label className="p-2 rounded-full hover:bg-[var(--color-chirp)]/10 transition cursor-pointer">
              <Image size={20} />
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} disabled={images.length >= 4} />
            </label>
            <button className="p-2 rounded-full hover:bg-[var(--color-chirp)]/10 transition">
              <Smile size={20} />
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            {charCount > 0 && (
              <span className={`text-sm ${isOverLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-500' : 'text-[var(--text-muted)]'}`}>
                {charCount}/280
              </span>
            )}
            <Button size="sm" disabled={isDisabled} onClick={handlePost}>
              {tweetMutation.isPending || isUploading ? <Loader2 className="animate-spin w-4 h-4" /> : isReply ? 'Reply' : 'Post'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
