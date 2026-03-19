'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, MessageSquare, ArrowLeft, Search,
    Smile, MoreVertical, Check, CheckCheck,
    Loader2, Home
} from 'lucide-react';
import Link from 'next/link';
import { chatService } from '@/services/chatService';
import { useAuthStore } from '@/store/useAuthStore';
import { Message, TypingEvent } from '@/types/chat';
import { User } from '@/types/user';
import { Booking } from '@/types/booking';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';

const EMOJIS = ['😊', '😂', '🤣', '😍', '😒', '👍', '🙌', '✨', '🔥', '💡', '💯', '🙏', '❤️', '💙', '✅', '🚀', '🤔', '👀', '👋', '🎉', '💪', '📍', '📞', '📧', '💼', '🎓', '🌟', '🍀', '🌈', '🎁'];

export default function ChatContent() {
    const { user, token } = useAuthStore();
    const { error, success } = useToast();
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
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Scroll to bottom helper
    const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
        const el = messagesContainerRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior });
    }, []);

    // 1. Fetch Contacts and Initial Data
    const fetchInitialData = useCallback(async () => {
        if (!user) return;
        setIsLoadingContacts(true);
        try {
            const uniqueUsers = new Map<number, User>();

            // Parallel fetch for bookings, conversations and unread count
            const [bookingsRes, conversationUsers, unreadData] = await Promise.all([
                api.get<Booking[]>('/bookings/'),
                chatService.getConversations().catch(() => []),
                chatService.getUnreadCount().catch(() => ({ count: 0 }))
            ]);

            // Handle Bookings
            bookingsRes.data.forEach(b => {
                let contact: User | undefined;
                if (user.role === 'STUDENT' && b.expert?.user) {
                    contact = { ...b.expert.user, role: 'EXPERT' } as User;
                } else if (user.role === 'EXPERT') {
                    contact = b.student;
                }
                if (contact && contact.id !== user.id) uniqueUsers.set(contact.id, contact);
            });

            // Handle Conversations
            conversationUsers.forEach(u => {
                if (u.id !== user?.id && !uniqueUsers.has(u.id)) uniqueUsers.set(u.id, u);
            });

            // Handle URL params expert
            if (initialOtherUserId) {
                const id = parseInt(initialOtherUserId);
                if (!uniqueUsers.has(id)) {
                    try {
                        const { data: expert } = await api.get(`/experts/${id}`);
                        if (expert?.user) {
                            uniqueUsers.set(expert.user.id, { ...expert.user, role: 'EXPERT' } as User);
                        }
                    } catch (err) { /* Not found */ }
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

    // 2. WebSocket Connection (Stable - doesn't reconnect on activeContactId change)
    const activeContactIdRef = useRef<number | null>(activeContactId);
    useEffect(() => {
        activeContactIdRef.current = activeContactId;
    }, [activeContactId]);

    useEffect(() => {
        if (!token || !user?.id) {
            console.log('🔌 [Chat] Skip connection: No token or user', { hasToken: !!token, hasUser: !!user?.id });
            return;
        }

        let reconnectTimeout: NodeJS.Timeout;

        const connectWS = () => {
            // Determine WS protocol and host
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            let host = window.location.host;
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
                const urlObj = new URL(apiUrl);
                host = urlObj.host;

                if (host.includes('127.0.0.1') && window.location.hostname === 'localhost') {
                    host = host.replace('127.0.0.1', 'localhost');
                } else if (host.includes('localhost') && window.location.hostname === '127.0.0.1') {
                    host = host.replace('localhost', '127.0.0.1');
                }
            } catch (e) {
                console.error('❌ [Chat] Invalid NEXT_PUBLIC_API_URL', e);
            }

            const wsUrl = `${protocol}//${host}/api/v1/chat/ws?token=${encodeURIComponent(token)}`;
            console.log(`🔌 [Chat] Attempting connection:`, {
                url: wsUrl.split('?')[0] + '?token=...',
                protocol: protocol,
                host: host
            });

            ws.current = new WebSocket(wsUrl);

            ws.current.onopen = () => {
                console.log('✅ [Chat] WebSocket Connected successfully');
            };

            ws.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // Handle Typing Indicator
                    if (data.type === 'typing') {
                        setTypingUsers(prev => ({ ...prev, [data.sender_id]: data.is_typing }));
                        return;
                    }

                    // Handle New Message
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
                        // Automatically mark as read if chat is open
                        if (msg.sender_id === currentActiveId) {
                            chatService.markAsRead(currentActiveId);
                        }
                    } else if (msg.sender_id !== user.id) {
                        // Increment unread count for non-active contact
                        setUnreadCounts(prev => ({
                            ...prev,
                            [msg.sender_id]: (prev[msg.sender_id] || 0) + 1
                        }));
                    }
                } catch (err) {
                    console.error('❌ [Chat] WS Message Error:', err);
                }
            };

            ws.current.onclose = (event) => {
                console.warn(`📡 [Chat] WebSocket closed (code: ${event.code}, reason: ${event.reason || 'none'}). Retrying in 5s...`);
                // Only reconnect if not intentionally closed
                if (event.code !== 1000 && event.code !== 1001) {
                    reconnectTimeout = setTimeout(connectWS, 5000);
                }
            };

            ws.current.onerror = (err) => {
                console.error('⚠️ [Chat] WebSocket error detected. Potential causes: 401 Unauthorized, 404 Not Found, or Network issues.', err);
            };
        };

        connectWS();

        return () => {
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            if (ws.current) {
                ws.current.onclose = null; // Prevent reconnect on intentional unmount
                ws.current.close();
            }
        };
    }, [user?.id, token]);

    // 3. Load Chat History when contact changes
    useEffect(() => {
        if (!activeContactId) return;
        const fetchHistory = async () => {
            setIsLoadingMessages(true);
            try {
                const data = await chatService.getChatHistory(activeContactId);
                setMessages(data.reverse());
                await chatService.markAsRead(activeContactId);
                setUnreadCounts(prev => ({ ...prev, [activeContactId]: 0 }));
            } catch (err) {
                error('Không thể tải lịch sử tin nhắn');
            } finally {
                setIsLoadingMessages(false);
            }
        };
        fetchHistory();
    }, [activeContactId, error]);

    // 4. Auto-scroll and Textarea Resize
    useEffect(() => {
        scrollToBottom(messages.length === 0 ? 'instant' : 'smooth');
    }, [messages, scrollToBottom]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [newMessage]);

    // 5. Typing Indicator Logic
    const sendTypingStatus = (isTyping: boolean) => {
        if (ws.current?.readyState === WebSocket.OPEN && activeContactId) {
            ws.current.send(JSON.stringify({
                type: 'typing',
                receiver_id: activeContactId,
                is_typing: isTyping
            }));
        }
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewMessage(e.target.value);

        if (!activeContactId) return;

        // Send typing indicator
        sendTypingStatus(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            sendTypingStatus(false);
        }, 2000);
    };

    // 6. Send Message
    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || !activeContactId || isSending) return;

        setIsSending(true);
        const content = newMessage.trim();
        setNewMessage('');
        sendTypingStatus(false);

        try {
            await chatService.sendMessage({ receiver_id: activeContactId, content });
        } catch (err: unknown) {
            const errorObj = err as { response?: { data?: { detail?: string } } };
            const detail = errorObj.response?.data?.detail || 'Không thể gửi tin nhắn';
            error(detail);
            setNewMessage(content); // Restore
        } finally {
            setIsSending(false);
        }
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
    };

    const filteredContacts = useMemo(() =>
        contacts.filter(c => c.full_name.toLowerCase().includes(contactSearch.toLowerCase())),
        [contacts, contactSearch]);

    const activeContact = useMemo(() =>
        contacts.find(c => c.id === activeContactId),
        [contacts, activeContactId]);

    const groupedMessages = useMemo(() => {
        const groups: { date: string; messages: Message[] }[] = [];
        messages.forEach(msg => {
            const date = new Date(msg.created_at).toLocaleDateString('vi-VN', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            });
            const lastGroup = groups[groups.length - 1];
            if (lastGroup && lastGroup.date === date) {
                lastGroup.messages.push(msg);
            } else {
                groups.push({ date, messages: [msg] });
            }
        });
        return groups;
    }, [messages]);

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* ── Sidebar ── */}
            <motion.div
                className={`
                    w-full md:w-96 lg:w-[420px] flex-col flex-shrink-0 bg-[#0A1018] border-r border-white/5
                    ${activeContactId ? 'hidden md:flex' : 'flex'}
                `}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="p-8 border-b border-white/5 bg-white/5">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <Link href="/">
                                <div className="w-10 h-10 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#C9A84C] hover:border-[#C9A84C]/40 transition-all duration-700 rounded-[2px] group/home">
                                    <Home className="w-4 h-4 transition-transform duration-700 group-hover/home:scale-110" strokeWidth={1.5} />
                                </div>
                            </Link>
                            <h2 className="text-[clamp(28px,3vw,32px)] font-serif italic text-white tracking-tight font-light">Tin nhắn</h2>
                        </div>
                        <div className="w-10 h-10 bg-[#C9A84C] text-[#0A1018] flex items-center justify-center rounded-[2px] shadow-xl">
                            <MessageSquare className="w-5 h-5" strokeWidth={1.5} />
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm tâm giao..."
                            value={contactSearch}
                            onChange={e => setContactSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 text-[15px] font-sans font-light bg-white/5 border border-white/10 focus:border-[#C9A84C]/40 transition-all outline-none text-white placeholder:text-white/20 rounded-[2px]"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {isLoadingContacts && contacts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 space-y-3">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            <p className="text-sm text-slate-400">Đang tải...</p>
                        </div>
                    ) : filteredContacts.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="w-20 h-20 bg-white/5 rounded-[2px] border border-white/5 flex items-center justify-center mx-auto mb-6">
                                <Search className="w-8 h-8 text-white/10" />
                            </div>
                            <p className="text-[10px] font-normal text-white/40 uppercase tracking-[0.4em] font-sans">Không tìm thấy nhân tài</p>
                        </div>
                    ) : (
                        filteredContacts.map((contact, idx) => (
                            <motion.button
                                key={contact.id}
                                initial={{ opacity: 0, x: -10, scale: 0.98 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: idx * 0.04 }}
                                onClick={() => setActiveContactId(contact.id)}
                                className={`
                                    w-full p-6 flex items-center gap-5 text-left transition-all duration-700 relative group
                                    ${activeContactId === contact.id ? 'bg-[#090C12] shadow-2xl' : 'hover:bg-white/[0.03]'}
                                `}
                            >
                                <div className="relative flex-shrink-0">
                                    <img
                                        src={contact.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.full_name)}&background=0A1018&color=C9A84C&bold=true`}
                                        className="w-14 h-14 rounded-[2px] object-cover border border-white/10 grayscale-[0.2] transition-all duration-700 group-hover:grayscale-0"
                                        alt={contact.full_name}
                                    />
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#A85C1E] border-2 border-[#0A1018] rounded-full shadow-lg" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className={`font-serif italic text-lg tracking-tight transition-colors duration-700 ${activeContactId === contact.id ? 'text-[#C9A84C]' : 'text-white/90 group-hover:text-white'}`}>
                                            {contact.full_name}
                                        </h4>
                                        {unreadCounts[contact.id] > 0 && (
                                            <span className="bg-[#C9A84C] text-[#0A1018] text-[9px] font-normal px-2 py-0.5 rounded-[1px] tracking-widest">
                                                {unreadCounts[contact.id]}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] font-normal text-white/40 uppercase tracking-[0.2em] font-sans">
                                        {contact.role === 'EXPERT' ? 'Chuyên gia' : 'Học viên'}
                                    </p>
                                </div>

                                {activeContactId === contact.id && (
                                    <motion.div
                                        layoutId="contact-indicator"
                                        className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#C9A84C]"
                                    />
                                )}
                            </motion.button>
                        ))
                    )}
                </div>
            </motion.div>

            {/* ── Chat Area ── */}
            <div className={`flex-1 flex flex-col min-w-0 ${!activeContactId ? 'hidden md:flex' : 'flex'}`}>
                {activeContactId && activeContact ? (
                    <>
                        {/* Header */}
                        <div className="h-20 flex-shrink-0 px-8 bg-[#F5F0E8] border-b border-[#C9A84C]/10 flex items-center justify-between z-10">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setActiveContactId(null)}
                                    className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-600"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div className="relative">
                                    <img
                                        src={activeContact.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeContact.full_name)}&background=0A1018&color=C9A84C&bold=true`}
                                        className="w-12 h-12 rounded-[2px] object-cover border border-[#0A1018]/5"
                                        alt={activeContact.full_name}
                                    />
                                </div>
                                <div>
                                    <h3 className="font-serif italic text-[#0A1018] text-2xl leading-tight font-light">
                                        {activeContact.full_name}
                                    </h3>
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="w-2.5 h-2.5 bg-[#A85C1E] rounded-full animate-pulse shadow-[0_0_10px_rgba(168,92,30,0.5)]" />
                                        <span className="text-[11px] text-[#0A1018]/60 font-medium uppercase tracking-[0.25em] font-sans">
                                            {typingUsers[activeContactId] ? 'Đang họa tâm tư...' : 'Hiện diện'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors">
                                <MoreVertical className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div
                            ref={messagesContainerRef}
                            className="flex-1 overflow-y-auto p-12 space-y-12 bg-[#FAF7F2]"
                        >
                            {isLoadingMessages ? (
                                <div className="flex flex-col items-center justify-center h-full space-y-3">
                                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                                    <p className="text-xs text-slate-400">Đang tải tin nhắn...</p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <div className="w-24 h-24 bg-[#0A1018] shadow-2xl flex items-center justify-center mb-10 border border-[#C9A84C]/20 rounded-[2px]">
                                        <MessageSquare className="w-10 h-10 text-[#C9A84C]" strokeWidth={1} />
                                    </div>
                                    <h4 className="text-[#0A1018] font-serif italic text-3xl mb-6 font-light">Khởi tạo tâm giao</h4>
                                    <p className="text-[#2A1608]/60 font-sans text-sm max-w-[280px] leading-relaxed uppercase tracking-[0.2em] font-normal">
                                        Hãy gửi lời chào đầu tiên đến {activeContact.full_name.split(' ').pop()} nhân tài.
                                    </p>
                                </div>
                            ) : (
                                groupedMessages.map(group => (
                                    <div key={group.date} className="space-y-4">
                                        <div className="flex items-center justify-center py-6">
                                            <span className="px-5 py-2 bg-white/40 border border-[#C9A84C]/10 text-[#6B4F27] text-[10px] font-normal uppercase tracking-[0.3em] font-sans rounded-[1px]">
                                                {group.date}
                                            </span>
                                        </div>

                                        {group.messages.map((msg) => {
                                            const isMe = msg.sender_id === user?.id;
                                            return (
                                                <motion.div
                                                    key={msg.id}
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                                                >
                                                    <div className={`
                                                        max-w-[85%] md:max-w-[80%] lg:max-w-[75%] px-10 py-6 shadow-xl text-[17px] font-sans font-normal rounded-[2px] tracking-[0.01em]
                                                        ${isMe
                                                            ? 'bg-[#090C12] text-[#F5F0E8]/80 shadow-[#090C12]/15'
                                                            : 'bg-white text-[#2A1608] border border-[#C9A84C]/10 shadow-sm'
                                                        }
                                                        hover:shadow-2xl transition-all duration-700 hover:scale-[1.01] origin-bottom
                                                    `}>
                                                        <p className="whitespace-pre-wrap break-words leading-[1.75]">
                                                            {msg.content}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-3 px-2">
                                                        <span className="text-[10px] text-[#0A1018]/40 font-normal uppercase tracking-[0.15em] font-sans">
                                                            {formatTime(msg.created_at)}
                                                        </span>
                                                        {isMe && (
                                                            msg.is_read ? (
                                                                <CheckCheck className="w-3.5 h-3.5 text-[#A85C1E]" strokeWidth={1.5} />
                                                            ) : (
                                                                <Check className="w-3.5 h-3.5 text-[#0A1018]/20" strokeWidth={1.5} />
                                                            )
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                ))
                            )}

                            {typingUsers[activeContactId] && (
                                <div className="flex items-center gap-4 text-[#0A1018]/40 ml-2">
                                    <div className="flex gap-1.5">
                                        <motion.div className="w-1 h-1 bg-[#C9A84C]/40 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut" }} />
                                        <motion.div className="w-1 h-1 bg-[#C9A84C]/40 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut", delay: 0.2 }} />
                                        <motion.div className="w-1 h-1 bg-[#C9A84C]/40 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut", delay: 0.4 }} />
                                    </div>
                                    <span className="text-[10px] font-normal uppercase tracking-[0.2em] font-sans italic">Đang họa tâm tư...</span>
                                </div>
                            )}
                        </div>

                        {/* Input Area - Expanded Fluidity */}
                        <div className="p-10 bg-[#F5F0E8] border-t border-[#C9A84C]/10 relative">
                            <form onSubmit={handleSendMessage} className="flex items-end gap-8 w-full max-w-[1400px] mx-auto">
                                <div className="relative flex-1 bg-white/50 border border-[#C9A84C]/15 rounded-[2px] transition-all duration-700 focus-within:bg-white focus-within:border-[#C9A84C]/40 focus-within:shadow-2xl">
                                    <textarea
                                        ref={textareaRef}
                                        value={newMessage}
                                        onChange={handleTextChange}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Gửi gắm tâm tình..."
                                        rows={1}
                                        className="w-full bg-transparent px-8 py-6 text-[17px] font-sans font-normal text-[#2A1608] placeholder:text-[#2A1608]/20 focus:outline-none resize-none leading-[1.7] tracking-[0.01em]"
                                    />

                                    <div className="absolute right-2 bottom-2 flex items-center">
                                        <button
                                            type="button"
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            className={`p-2 transition-colors ${showEmojiPicker ? 'text-[#C9A84C] bg-[#0D1B2A]/5' : 'text-[#0D1B2A]/40 hover:text-[#0D1B2A]'}`}
                                        >
                                            <Smile className="w-6 h-6" />
                                        </button>
                                    </div>

                                    <AnimatePresence>
                                        {showEmojiPicker && (
                                            <motion.div
                                                className="absolute bottom-full right-0 mb-6 p-6 bg-white border border-[#C9A84C]/10 rounded-[2px] shadow-2xl z-20 w-80"
                                                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                                                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                            >
                                                <div className="grid grid-cols-6 gap-2">
                                                    {EMOJIS.map(emoji => (
                                                        <button
                                                            key={emoji}
                                                            type="button"
                                                            onClick={(e) => { e.preventDefault(); addEmoji(emoji); }}
                                                            className="text-xl hover:scale-125 transition-transform"
                                                        >
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
                                    className={`
                                        w-16 h-16 flex items-center justify-center transition-all duration-700 shadow-xl rounded-[2px]
                                        ${newMessage.trim() && !isSending
                                            ? 'bg-[#090C12] text-[#C9A84C] shadow-[#090C12]/20 hover:scale-[1.02] active:scale-[0.98] hover:bg-[#C9A84C] hover:text-[#0A1018]'
                                            : 'bg-[#090C12]/10 text-[#090C12]/20 shadow-none'
                                        }
                                    `}
                                >
                                    {isSending ? (
                                        <Loader2 className="w-6 h-6 animate-spin" strokeWidth={1} />
                                    ) : (
                                        <Send className="w-6 h-6" strokeWidth={1} />
                                    )}
                                </button>
                            </form>
                            <div className="mt-2 text-center">
                                <span className="text-[10px] text-slate-400 font-medium">Shift + Enter để xuống dòng · Enter để gửi</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[#FAF7F2] relative overflow-hidden">
                        <div className="absolute inset-0 opacity-[0.03] bg-[url('/mascot.png')] bg-center bg-no-repeat bg-contain scale-50 grayscale pointer-events-none" />

                        <div className="relative z-10 text-center max-w-lg">
                            <div className="w-32 h-32 bg-[#0A1018] shadow-2xl flex items-center justify-center mx-auto mb-12 border border-[#C9A84C]/20 rounded-[2px] transform transition-transform duration-1000 hover:scale-105">
                                <MessageSquare className="w-12 h-12 text-[#C9A84C]" strokeWidth={1} />
                            </div>
                            <h3 className="text-[clamp(40px,5vw,52px)] font-serif italic text-[#0A1018] mb-6 tracking-tight font-light leading-tight">Trung tâm Tin nhắn</h3>
                            <p className="text-[#2A1608]/80 font-sans font-light text-[17px] leading-[1.85] mb-12 max-w-md mx-auto tracking-[0.02em]">
                                Kết nối trực tiếp với chuyên gia và học viện. Trao đổi về chuyên môn, lịch hẹn và định hướng sự nghiệp của bạn.
                            </p>
                            <div className="flex flex-wrap justify-center gap-5">
                                {['Tư vấn chuyên sâu', 'Cập nhật lịch hẹn', 'Hỗ trợ 24/7'].map(tag => (
                                    <span key={tag} className="px-6 py-3 bg-white/60 text-[#A85C1E] text-[10px] font-normal border border-[#C9A84C]/10 uppercase tracking-[0.2em] shadow-sm font-sans rounded-[1px] hover:bg-white transition-colors duration-700">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
