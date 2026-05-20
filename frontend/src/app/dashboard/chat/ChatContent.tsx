'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    Send, MessageSquare, ArrowLeft, Search,
    Smile, MoreVertical, Check, CheckCheck,
    Loader2
} from 'lucide-react';
import { chatService } from '@/services/chatService';
import { useAuthStore } from '@/store/useAuthStore';
import { Message } from '@/types/chat';
import { User } from '@/types/user';
import { Booking } from '@/types/booking';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { getAvatarUrl } from '@/utils/url-utils';

const EMOJIS = ['😊', '😂', '🤣', '😍', '😒', '👍', '🙌', '✨', '🔥', '💡', '💯', '🙏', '❤️', '💙', '✅', '🚀', '🤔', '👀', '👋', '🎉', '💪', '📍', '📞', '📧', '💼', '🎓', '🌟', '🍀', '🌈', '🎁'];

const QUICK_REPLIES = [
    { text: "Chào bạn!", roles: ["STUDENT", "EXPERT", "ADMIN"] },
    { text: "Tôi cần tư vấn về lộ trình này.", roles: ["STUDENT"] },
    { text: "Lịch hẹn tiếp theo của chúng ta là khi nào?", roles: ["STUDENT", "EXPERT"] },
    { text: "Cảm ơn chuyên gia rất nhiều!", roles: ["STUDENT"] },
    { text: "Chào bạn, tôi có thể giúp gì cho bạn?", roles: ["EXPERT"] },
    { text: "Hãy xem qua lộ trình tôi đã chuẩn bị.", roles: ["EXPERT"] },
    { text: "Tôi đã nhận được thông tin, sẽ phản hồi sớm.", roles: ["EXPERT", "ADMIN"] },
    { text: "Hẹn gặp lại bạn!", roles: ["STUDENT", "EXPERT", "ADMIN"] },
];

export default function ChatContent() {
    const { user, token } = useAuthStore();
    const { error } = useToast();
    const searchParams = useSearchParams();
    const initialOtherUserId = searchParams.get('with');

    const [contacts, setContacts] = useState<User[]>([]);
    const [activeContactId, setActiveContactId] = useState<number | null>(
        initialOtherUserId ? parseInt(initialOtherUserId) : null
    );
    const [contactSearch, setContactSearch] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isLoadingContacts, setIsLoadingContacts] = useState(true);
    const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Record<number, boolean>>({});

    const ws = useRef<WebSocket | null>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Scroll to bottom helper
    const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
        const el = messagesContainerRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior });
    }, []);

    // 1. Fetch Contacts
    const fetchInitialData = useCallback(async () => {
        if (!user) return;
        setIsLoadingContacts(true);
        try {
            const uniqueUsers = new Map<number, User>();

            const [bookingsRes, conversationUsers] = await Promise.all([
                api.get<Booking[]>('bookings/'),
                chatService.getConversations().catch(() => []),
            ]);

            bookingsRes.data.forEach(b => {
                let contact: User | undefined;
                if (user.role === 'STUDENT' && b.expert?.user) {
                    contact = { ...b.expert.user, role: 'EXPERT' } as User;
                } else if (user.role === 'EXPERT') {
                    contact = b.student;
                }
                if (contact && contact.id !== user.id) uniqueUsers.set(contact.id, contact);
            });

            conversationUsers.forEach(u => {
                if (u.id !== user?.id && !uniqueUsers.has(u.id)) uniqueUsers.set(u.id, u);
            });

            if (initialOtherUserId) {
                const id = parseInt(initialOtherUserId);
                if (!uniqueUsers.has(id)) {
                    try {
                        const { data: expertUser } = await api.get(`users/${id}`);
                        if (expertUser) {
                            uniqueUsers.set(expertUser.id, expertUser);
                        }
                    } catch (err) { /* Not found */ }
                }
            }

            // 1.5. Ensure Support Admin is in contacts
            console.log('🔍 Fetching Support Admin for contact list...');
            try {
                const { data: adminUser } = await api.get('support/admin-profile');
                if (adminUser) {
                    uniqueUsers.set(adminUser.id, { ...adminUser, role: 'ADMIN' } as User);
                }
            } catch (err) {
                console.warn('⚠️ Support admin endpoint failed, trying fallback ID 2:', err);
                try {
                    const { data: fallbackAdmin } = await api.get('users/2');
                    if (fallbackAdmin && fallbackAdmin.id !== user.id) {
                        uniqueUsers.set(fallbackAdmin.id, { ...fallbackAdmin, role: 'ADMIN' } as User);
                    }
                } catch (err2) {
                    console.error('❌ All admin fetch attempts failed');
                }
            }

            setContacts(Array.from(uniqueUsers.values()));
        } catch (err) {
            error('Không thể tải danh sách liên hệ');
        } finally {
            setIsLoadingContacts(false);
        }
    }, [user, initialOtherUserId, error]);

    useEffect(() => { fetchInitialData(); }, [fetchInitialData]);


    // 2. WebSocket
    const activeContactIdRef = useRef<number | null>(activeContactId);
    useEffect(() => { activeContactIdRef.current = activeContactId; }, [activeContactId]);

    useEffect(() => {
        if (!token || !user?.id) return;

        const connectWS = () => {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            let host = window.location.host;
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001/api/v1';
                host = new URL(apiUrl).host;
                if (host.includes('127.0.0.1') && window.location.hostname === 'localhost') {
                    host = host.replace('127.0.0.1', 'localhost');
                }
            } catch (e) {}

            const wsUrl = `${protocol}//${host}/api/v1/chat/ws?token=${encodeURIComponent(token)}`;
            ws.current = new WebSocket(wsUrl);

            ws.current.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'typing') {
                    setTypingUsers(prev => ({ ...prev, [data.sender_id]: data.is_typing }));
                    return;
                }

                const msg = data as Message;
                const currentActiveId = activeContactIdRef.current;

                if (
                    (msg.sender_id === currentActiveId && msg.receiver_id === user.id) ||
                    (msg.sender_id === user.id && msg.receiver_id === currentActiveId)
                ) {
                    setMessages(prev => {
                        if (prev.find(m => m.id === msg.id)) return prev;
                        return [...prev, msg];
                    });
                    if (msg.sender_id === currentActiveId) chatService.markAsRead(currentActiveId);
                } else if (msg.sender_id !== user.id) {
                    setUnreadCounts(prev => ({ ...prev, [msg.sender_id]: (prev[msg.sender_id] || 0) + 1 }));
                }
            };

            ws.current.onclose = () => {
                setTimeout(connectWS, 3000);
            };
        };

        connectWS();
        return () => ws.current?.close();
    }, [token, user?.id]);

    // 3. Fetch Messages
    useEffect(() => {
        if (!activeContactId) {
            setMessages([]);
            return;
        }

        const fetchMessages = async () => {
            setIsLoadingMessages(true);
            try {
                const msgs = await chatService.getMessages(activeContactId);
                setMessages(msgs.reverse());
                setUnreadCounts(prev => ({ ...prev, [activeContactId]: 0 }));
                chatService.markAsRead(activeContactId);
                setTimeout(() => scrollToBottom('auto'), 100);
            } catch (err) {
                error('Không thể tải tin nhắn');
            } finally {
                setIsLoadingMessages(false);
            }
        };

        fetchMessages();
    }, [activeContactId, error, scrollToBottom]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // 4. Actions
    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() || !activeContactId || isSending) return;

        setIsSending(true);
        try {
            const msg = await chatService.sendMessage(activeContactId, newMessage.trim());
            setMessages(prev => {
                if (prev.find(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
            setNewMessage('');
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
        } catch (err) {
            error('Lỗi khi gửi tin nhắn');
        } finally {
            setIsSending(false);
        }
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewMessage(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const addEmoji = (emoji: string) => {
        setNewMessage(prev => prev + emoji);
        setShowEmojiPicker(false);
        textareaRef.current?.focus();
    };

    const filteredContacts = contacts.filter(c =>
        c.full_name.toLowerCase().includes(contactSearch.toLowerCase())
    );

    const activeContact = useMemo(() =>
        contacts.find(c => c.id === activeContactId),
    [contacts, activeContactId]);

    const groupedMessages = useMemo(() => {
        const groups: Record<string, Message[]> = {};
        messages.forEach(m => {
            const date = new Date(m.created_at).toLocaleDateString('vi-VN', {
                weekday: 'long', day: 'numeric', month: 'long'
            });
            if (!groups[date]) groups[date] = [];
            groups[date].push(m);
        });
        return Object.entries(groups).map(([date, msgs]) => ({ date, messages: msgs }));
    }, [messages]);

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex h-[calc(100vh-100px)] bg-white overflow-hidden rounded-0 border-[6px] border-[#00A4FD] shadow-2xl m-4">
            {/* ── Sidebar ── */}
            <motion.div
                className={`
                    w-full md:w-80 lg:w-96 flex-col flex-shrink-0 bg-white border-r-[6px] border-[#00A4FD]/10
                    ${activeContactId ? 'hidden md:flex' : 'flex'}
                `}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="p-8 border-b-[2px] border-black/5 bg-[#F5F8FF]">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="p-2 -ml-2 text-black/40 hover:text-[#00A4FD] transition-colors group" title="Trở về Dashboard">
                                <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                            </Link>
                            <h2 className="text-2xl font-serif italic text-black tracking-tight font-black uppercase">Tin nhắn</h2>
                        </div>
                        <div className="w-10 h-10 bg-white border-[2px] border-[#00A4FD] text-[#00A4FD] flex items-center justify-center rounded-0 shadow-lg">
                            <MessageSquare className="w-5 h-5" strokeWidth={3} />
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={contactSearch}
                            onChange={e => setContactSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 text-sm font-black bg-white border-[2px] border-black/5 focus:border-[#00A4FD] transition-all outline-none text-black placeholder:text-black/20 rounded-0"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {isLoadingContacts ? (
                        <div className="flex flex-col items-center justify-center p-12 space-y-3">
                            <Loader2 className="w-8 h-8 text-[#00A4FD] animate-spin" />
                            <p className="text-[10px] text-black/40 font-black uppercase tracking-widest">Đang tải...</p>
                        </div>
                    ) : (filteredContacts.length === 0 ? (
                        <div className="p-16 text-center">
                            <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.4em]">Trống vắng</p>
                        </div>
                    ) : (
                        filteredContacts.map((contact, idx) => (
                                <button
                                    key={contact.id}
                                    onClick={() => setActiveContactId(contact.id)}
                                    className={`
                                        w-full p-4 flex items-center gap-4 text-left transition-all duration-300 relative group border-b border-black/5
                                        ${activeContactId === contact.id ? 'bg-[#F5F8FF]' : 'hover:bg-black/[0.02]'}
                                    `}
                                >
                                <div className="relative flex-shrink-0">
                                    <img
                                        src={getAvatarUrl(contact.avatar_url, contact.full_name)}
                                        className={`w-12 h-12 object-cover border-[2px] transition-all ${activeContactId === contact.id ? 'border-[#00A4FD]' : 'border-black/10'}`}
                                        alt={contact.full_name}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = getAvatarUrl(null, contact.full_name);
                                        }}
                                    />
                                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className={`font-black text-sm truncate uppercase ${activeContactId === contact.id ? 'text-[#00A4FD]' : 'text-black'}`}>
                                            {contact.full_name}
                                        </h4>
                                        {unreadCounts[contact.id] > 0 && (
                                            <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5">
                                                {unreadCounts[contact.id]}
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-[9px] font-black uppercase tracking-widest ${activeContactId === contact.id ? 'text-[#00A4FD]/60' : 'text-black/30'}`}>
                                        {contact.role === 'ADMIN' ? 'Hỗ trợ hệ thống' : (contact.role === 'EXPERT' ? 'Chuyên gia' : 'Thành viên')}
                                    </p>
                                </div>
                            </button>
                        ))
                    ))}
                </div>
            </motion.div>

            {/* ── Chat Area ── */}
            <div className={`flex-1 flex flex-col min-w-0 bg-white ${!activeContactId ? 'hidden md:flex' : 'flex'}`}>
                {activeContactId && activeContact ? (
                    <>
                        <div className="h-24 flex-shrink-0 px-8 bg-white border-b border-black/5 flex items-center justify-between z-10 shadow-sm">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setActiveContactId(null)} className="md:hidden p-2 -ml-2 text-black/40 hover:text-[#00A4FD]">
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <img
                                    src={getAvatarUrl(activeContact.avatar_url, activeContact.full_name)}
                                    className="w-12 h-12 object-cover border-[2px] border-black/10 shadow-lg"
                                    alt={activeContact.full_name}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = getAvatarUrl(null, activeContact.full_name);
                                    }}
                                />
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-serif italic text-black text-2xl font-black uppercase">{activeContact.full_name}</h3>
                                        {activeContact.role === 'ADMIN' && (
                                            <span className="bg-[#FFE900] text-[#0046EA] text-[9px] font-black px-2 py-0.5 uppercase tracking-widest">Hỗ trợ</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 animate-pulse" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-black/40">
                                            {typingUsers[activeContactId] ? 'Đang viết...' : 'Trực tuyến'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                             <button className="p-3 text-black/20 hover:text-[#00A4FD] hover:bg-[#F5F8FF] transition-all">
                                <MoreVertical className="w-5 h-5" />
                            </button>
                        </div>

                        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 bg-white custom-scrollbar">
                            {isLoadingMessages ? (
                                <div className="flex flex-col items-center justify-center h-full space-y-3">
                                    <Loader2 className="w-8 h-8 text-[#00A4FD] animate-spin" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-black/20">Đang đồng bộ...</p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center max-w-xs mx-auto">
                                    <div className="w-24 h-24 bg-[#F5F8FF] flex items-center justify-center mb-8 rounded-0 border-[6px] border-[#00A4FD]/10">
                                        <MessageSquare className="w-10 h-10 text-[#00A4FD]" strokeWidth={3} />
                                    </div>
                                    <h4 className="text-black font-serif italic text-3xl mb-3 font-black uppercase">Bắt đầu kết nối</h4>
                                    <p className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] leading-loose">
                                        Hãy gửi lời chào đầu tiên để mở ra hành trình tri thức.
                                    </p>
                                </div>
                            ) : (
                                groupedMessages.map(group => (
                                    <div key={group.date} className="space-y-8">
                                        <div className="flex items-center justify-center">
                                            <div className="h-px flex-1 bg-black/5" />
                                            <span className="px-6 text-[9px] font-black text-black/20 uppercase tracking-[0.4em]">{group.date}</span>
                                            <div className="h-px flex-1 bg-black/5" />
                                        </div>
                                        {group.messages.map((msg) => {
                                            const isMe = msg.sender_id === user?.id;
                                            return (
                                                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                    <div className={`
                                                        max-w-[80%] md:max-w-[65%] px-7 py-5 rounded-0 text-[15px] leading-relaxed shadow-sm transition-all border-[2px]
                                                        ${isMe ? 'bg-[#00A4FD] border-[#00A4FD] text-white' : 'bg-white text-black border-black/5'}
                                                    `}>
                                                        <p className="font-bold">{msg.content}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2 px-2">
                                                        <span className="text-[9px] font-black text-black/20 uppercase tracking-widest">{formatTime(msg.created_at)}</span>
                                                        {isMe && (msg.is_read ? <CheckCheck className="w-3.5 h-3.5 text-[#00A4FD]" /> : <Check className="w-3.5 h-3.5 text-black/10" />)}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                ))
                            )}
                            {typingUsers[activeContactId] && (
                                <div className="flex items-center gap-3 ml-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-[#00A4FD] rounded-0 animate-bounce" />
                                        <div className="w-1.5 h-1.5 bg-[#00A4FD] rounded-0 animate-bounce [animation-delay:0.2s]" />
                                        <div className="w-1.5 h-1.5 bg-[#00A4FD] rounded-0 animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                    <span className="text-[10px] font-black text-[#0046EA] uppercase tracking-widest italic">Đối phương đang viết...</span>
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-white border-t border-black/5">
                            {/* Quick Replies Section */}
                            <div className="max-w-5xl mx-auto mb-6 flex flex-wrap gap-3">
                                {QUICK_REPLIES.filter(r => !user?.role || r.roles.includes(user.role)).map((reply, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => {
                                            setNewMessage(reply.text);
                                            // Optional: handleSendMessage() if you want instant send
                                        }}
                                        className="px-4 py-2 bg-[#F5F8FF] border border-[#00A4FD]/20 text-[#00A4FD] text-[10px] font-black uppercase tracking-widest hover:bg-[#00A4FD] hover:text-white transition-all rounded-0"
                                    >
                                        {reply.text}
                                    </button>
                                ))}
                            </div>

                            <form onSubmit={handleSendMessage} className="flex items-end gap-5 max-w-5xl mx-auto">
                                <div className="relative flex-1 bg-white border-[6px] border-[#00A4FD]/10 rounded-0 transition-all focus-within:border-[#00A4FD] focus-within:shadow-2xl">
                                    <textarea
                                        ref={textareaRef}
                                        value={newMessage}
                                        onChange={handleTextChange}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Gửi tin nhắn..."
                                        rows={1}
                                        className="w-full bg-transparent px-8 py-5 text-sm font-black text-black placeholder:text-black/20 focus:outline-none resize-none leading-relaxed"
                                    />
                                    <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="absolute right-6 bottom-4 p-2 text-black/20 hover:text-[#00A4FD] transition-colors">
                                        <Smile className="w-6 h-6" />
                                    </button>
                                    <AnimatePresence>
                                        {showEmojiPicker && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full right-0 mb-6 p-5 bg-white border-[4px] border-black rounded-0 shadow-2xl z-20 w-80">
                                                <div className="grid grid-cols-6 gap-3">
                                                    {EMOJIS.map(emoji => (
                                                        <button key={emoji} type="button" onClick={() => addEmoji(emoji)} className="text-2xl hover:scale-150 transition-transform">
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || isSending}
                                    className={`w-14 h-14 flex items-center justify-center rounded-0 shadow-xl transition-all ${newMessage.trim() && !isSending ? 'bg-black text-white hover:bg-[#00A4FD] hover:scale-110 active:scale-95' : 'bg-black/5 text-black/10'}`}
                                >
                                    {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" strokeWidth={3} />}
                                </button>
                            </form>
                            <p className="mt-4 text-center text-[9px] font-black text-black/20 uppercase tracking-[0.3em]">Shift + Enter để xuống dòng · Enter để gửi</p>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white text-center">
                        <div className="w-32 h-32 bg-[#F5F8FF] border-[6px] border-[#00A4FD]/20 flex items-center justify-center mb-10 rounded-0 shadow-inner">
                            <MessageSquare className="w-12 h-12 text-[#00A4FD]" strokeWidth={3} />
                        </div>
                        <h3 className="text-4xl font-serif italic text-black mb-6 font-black uppercase tracking-tight">Hành lang tri thức</h3>
                        <p className="text-[10px] font-black text-black/30 uppercase tracking-[0.4em] max-w-xs leading-loose">
                            Hãy chọn một nhân tài để bắt đầu hội thoại định hướng sự nghiệp của bạn.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
