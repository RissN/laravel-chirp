import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Settings, Send, Loader2 } from 'lucide-react';
import { getConversations, getMessages, sendMessage, markAsRead } from '../../api/conversations';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../../components/ui/Avatar';

export default function Messages() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activePartner, setActivePartner] = useState<any>(null); // To store the selected user
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch Conversation List
  const { data: conversationsData, isLoading: isConvLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations
  });

  // Fetch specific thread
  const { data: messagesData, isLoading: isMessagesLoading } = useQuery({
    queryKey: ['messages', activeConvId],
    queryFn: () => getMessages(activeConvId!),
    enabled: !!activeConvId
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: (content: string) => sendMessage(activePartner.id, content),
    onSuccess: (data) => {
      setMessageInput('');
      queryClient.invalidateQueries({ queryKey: ['messages', activeConvId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      // If there was no activeConvId, we just created it.
      if (!activeConvId && data.data?.conversation_id) {
        setActiveConvId(data.data.conversation_id);
      }
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData?.data]);

  const handleSelectConversation = (conv: any) => {
    setActivePartner(conv.partner);
    setActiveConvId(conv.id);
    if (conv.unread_count > 0) {
      markAsRead(conv.id).then(() => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      });
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activePartner) return;
    sendMutation.mutate(messageInput.trim());
  };

  return (
    <div className="min-h-screen flex h-[100vh]">
      {/* Inbox List */}
      <div className={`w-full xl:w-2/5 border-r border-[var(--border-color)] flex flex-col ${activeConvId ? 'hidden xl:flex' : 'flex'}`}>
        <div className="sticky top-0 z-10 bg-[var(--bg-color)]/80 backdrop-blur-md p-4 flex justify-between items-center border-b border-[var(--border-color)]">
          <h1 className="text-xl font-bold">Messages</h1>
          <div className="flex gap-2 text-[var(--text-color)]">
            <Settings size={20} className="cursor-pointer" />
            <Mail size={20} className="cursor-pointer" />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {isConvLoading ? (
             <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[var(--color-chirp)]" /></div>
          ) : conversationsData?.data?.length === 0 ? (
             <div className="p-8 text-center text-[var(--text-muted)]">No messages yet.</div>
          ) : (
            conversationsData?.data?.map((conv: any) => (
              <div 
                key={conv.id} 
                onClick={() => handleSelectConversation(conv)}
                className={`flex gap-3 p-4 border-b border-[var(--border-color)] cursor-pointer transition ${activeConvId === conv.id ? 'bg-[var(--hover-bg)]' : 'hover:bg-[var(--hover-bg)]'}`}
              >
                <Avatar name={conv.partner.name} src={conv.partner.avatar} />
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <p className="font-bold flex items-center gap-2">
                       {conv.partner.name}
                       {conv.unread_count > 0 && (
                         <span className="w-2 h-2 rounded-full bg-[var(--color-chirp)] inline-block"></span>
                       )}
                    </p>
                  </div>
                  <p className={`text-sm truncate ${conv.unread_count > 0 ? 'text-[var(--text-color)] font-medium' : 'text-[var(--text-muted)]'}`}>
                    {conv.last_message?.content || 'No messages'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Conversation Thread */}
      <div className={`w-full xl:w-3/5 flex-col bg-[var(--bg-color)] ${!activeConvId ? 'hidden xl:flex' : 'flex'}`}>
        {!activePartner ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <h2 className="text-3xl font-bold">Select a message</h2>
            <p className="text-[var(--text-muted)] mt-2">Choose from your existing conversations, start a new one, or just keep swimming.</p>
            <button className="mt-6 bg-[var(--color-chirp)] text-white px-8 py-3 rounded-full font-bold hover:bg-[var(--color-chirp-hover)] transition">
              New message
            </button>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-color)]/80 backdrop-blur-md sticky top-0 z-10 flex items-center gap-3">
               {/* Mobile Back Button */}
               <button className="xl:hidden mr-2 p-2 hover:bg-[var(--hover-bg)] rounded-full" onClick={() => setActiveConvId(null)}>
                  &larr;
               </button>
               <Avatar name={activePartner.name} src={activePartner.avatar} />
               <div>
                  <h2 className="font-bold text-lg">{activePartner.name}</h2>
                  <p className="text-xs text-[var(--text-muted)]">@{activePartner.username}</p>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
               {isMessagesLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[var(--color-chirp)]" /></div>
               ) : messagesData?.data && Array.isArray(messagesData.data) ? (
                  messagesData.data.slice().reverse().map((msg: any) => {
                     const isMine = msg.sender_id === user?.id;
                     return (
                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                           <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMine ? 'bg-[var(--color-chirp)] text-white rounded-br-sm' : 'bg-[var(--hover-bg)] text-[var(--text-color)] rounded-bl-sm'}`}>
                             {msg.content}
                           </div>
                        </div>
                     )
                  })
               ) : (
                  <div className="text-center p-8 text-[var(--text-muted)]">Say hi to {activePartner.name}!</div>
               )}
               <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-[var(--border-color)]">
               <form onSubmit={handleSendMessage} className="flex gap-2 items-center bg-[var(--hover-bg)] rounded-full px-4 py-2">
                 <input 
                   type="text" 
                   value={messageInput}
                   onChange={(e) => setMessageInput(e.target.value)}
                   placeholder="Start a new message"
                   className="flex-1 bg-transparent border-none focus:ring-0 outline-none p-2 text-[var(--text-color)]"
                 />
                 <button 
                   type="submit" 
                   disabled={!messageInput.trim() || sendMutation.isPending}
                   className="p-2 text-[var(--color-chirp)] hover:bg-[var(--color-chirp)]/10 rounded-full disabled:opacity-50 transition"
                 >
                   {sendMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                 </button>
               </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
