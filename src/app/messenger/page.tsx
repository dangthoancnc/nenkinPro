'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare, Send, Image as ImageIcon, Paperclip, CheckCircle2,
  UserCircle, Search, FileText, Users, Plus, Shield, UserCheck, X, Loader2,
  Archive, ArchiveRestore, Trash2, Inbox, AlertTriangle, MoreVertical, Zap, Unlock, CheckCircle,
  ChevronLeft, Info, Download, FolderPlus, Maximize2, Sparkles, UploadCloud,
  UserPlus, Edit3, BookUser, Crop, RotateCcw, ExternalLink,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import AssignToDossierModal, { AssignAttachmentTarget } from '@/components/messenger/AssignToDossierModal';
import AddMembersModal from '@/components/messenger/AddMembersModal';
import QuickNewChatModal from '@/components/messenger/QuickNewChatModal';
import ImageEditorModal from '@/components/messenger/ImageEditorModal';

export interface ChatAttachment {
  url: string;
  name: string;
  size?: number;
  type?: string;
  isEdited?: boolean;
  originalUrl?: string | null;
  originalName?: string;
  originalSize?: number;
  originalPurged?: boolean;
  purgedAt?: string;
}

interface ChatMessage {
  id: string;
  senderName: string;
  isMe: boolean;
  content: string;
  attachments?: ChatAttachment[];
  time: string;
  createdAt?: string;
  type?: string;
}

interface ChatConversation {
  id: string;
  customerId?: string | null;
  applicationId?: string | null;
  name: string;
  type: 'CUSTOMER' | 'CUSTOMER_SUPPORT' | 'CTV' | 'GROUP' | 'DIRECT';
  code?: string;
  phone?: string;
  email?: string;
  role?: string;
  lastMessage: string;
  updatedAt?: string;
  isArchived?: boolean;
  assignedUserId?: string | null;
  assignedUserName?: string | null;
  supportStatus?: 'UNASSIGNED' | 'ASSIGNED' | 'RESOLVED';
  isOnline?: boolean;
  lastActiveText?: string;
  membersCount?: number;
  members?: string[];
}

interface MemberItem {
  id: string;
  name: string;
  role?: string;
  code?: string;
  phone?: string;
  type: 'STAFF' | 'CUSTOMER';
  isOnline?: boolean;
  lastActiveText?: string;
}

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-100 text-blue-700 border-blue-200',
    'bg-emerald-100 text-emerald-700 border-emerald-200',
    'bg-violet-100 text-violet-700 border-violet-200',
    'bg-indigo-100 text-indigo-700 border-indigo-200',
    'bg-rose-100 text-rose-700 border-rose-200',
    'bg-sky-100 text-sky-700 border-sky-200',
    'bg-teal-100 text-teal-700 border-teal-200',
    'bg-amber-100 text-amber-800 border-amber-200',
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function MessengerPage() {
  const router = useRouter();
  const [chatCategory, setChatCategory] = useState<'CUSTOMER' | 'CTV' | 'GROUP' | 'ARCHIVED'>('CUSTOMER');
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // UI state for Right info panel & Mobile Responsive View
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  // Derived activeChat from conversations list using activeChatId
  const activeChat = conversations.find(c => c.id === activeChatId) || null;

  // Group creation modal state
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [memberCategoryTab, setMemberCategoryTab] = useState<'STAFF' | 'CUSTOMER'>('STAFF');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [availableStaffs, setAvailableStaffs] = useState<MemberItem[]>([]);
  const [availableCustomers, setAvailableCustomers] = useState<MemberItem[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  // New Navigation & 1-1 Chat Modals State
  const [sidebarView, setSidebarView] = useState<'INBOX' | 'CONTACTS'>('INBOX');
  const [directoryCategoryTab, setDirectoryCategoryTab] = useState<'STAFF' | 'CUSTOMER'>('STAFF');
  const [directorySearchQuery, setDirectorySearchQuery] = useState('');
  const [showQuickNewChatModal, setShowQuickNewChatModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);

  // File attachments, drag-drop, clipboard paste, and dossier modal state
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<Array<{ file: File; url: string; isImage: boolean; name: string; size: number }>>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [selectedAttachmentForDossier, setSelectedAttachmentForDossier] = useState<AssignAttachmentTarget | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxMetadata, setLightboxMetadata] = useState<{
    name: string;
    messageId?: string;
    editedUrl?: string;
    originalUrl?: string | null;
    originalName?: string;
    isViewingOriginal?: boolean;
    originalPurged?: boolean;
  } | null>(null);
  const [imageEditorTarget, setImageEditorTarget] = useState<{
    url: string;
    name: string;
    size?: number;
    messageId?: string;
    originalUrl?: string | null;
    originalName?: string;
    originalSize?: number;
    isPending?: boolean;
    pendingIndex?: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const prevMsgCountRef = useRef(0);

  // Ref to track current activeChatId across closures (prevents stale closure bug)
  const activeChatIdRef = useRef<string | null>(null);
  useEffect(() => { activeChatIdRef.current = activeChatId; }, [activeChatId]);

  // 1. Load real conversations from DB (silent = true prevents screen flicker)
  const loadConversations = (keepActive: boolean = true, silent: boolean = true) => {
    if (!silent) setLoadingChats(true);
    fetch('/api/messenger/conversations')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          const list: ChatConversation[] = data.data;
          setConversations(prev => {
            if (JSON.stringify(prev) === JSON.stringify(list)) return prev;
            return list;
          });

          // During silent polling, ONLY update conversation list — never re-select active chat
          // or re-load messages. Message polling is handled separately by its own useEffect.
          // This prevents the stale-closure bug where activeChatId was always null in the
          // setInterval callback, causing loadRealMessages(id, false) with loading spinner
          // every 5 seconds → content flash.
          if (silent) return;

          // Check if specific conversationId requested in URL
          const urlParams = new URLSearchParams(window.location.search);
          const urlConvId = urlParams.get('conversationId');
          const currentActiveId = activeChatIdRef.current;

          if (urlConvId) {
            const matched = list.find(c => c.id === urlConvId);
            if (matched && matched.id !== currentActiveId) {
              setActiveChatId(matched.id);
              loadRealMessages(matched.id, false);
              if (matched.isArchived) setChatCategory('ARCHIVED');
              else if (matched.type === 'CUSTOMER_SUPPORT' || matched.type === 'CUSTOMER') setChatCategory('CUSTOMER');
              else if (matched.type === 'CTV') setChatCategory('CTV');
              else if (matched.type === 'GROUP') setChatCategory('GROUP');
              return;
            }
          }

          if (!keepActive || !currentActiveId) {
            if (list.length > 0) {
              const activeList = list.filter(c => !c.isArchived);
              const first = activeList.find(c => c.type === 'CUSTOMER' || c.type === 'CUSTOMER_SUPPORT') || activeList[0] || list[0];
              if (first) {
                setActiveChatId(first.id);
                loadRealMessages(first.id, false);
              }
            }
          }
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!silent) setLoadingChats(false);
      });
  };

  useEffect(() => {
    loadConversations(false, false);
    loadMembersForModal();

    // Auto refresh conversation list & members presence every 8 seconds silently without screen flicker
    const interval = setInterval(() => {
      loadConversations(true, true);
      loadMembersForModal();
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // 2. Fetch real members for Group modal
  const loadMembersForModal = () => {
    fetch('/api/messenger/members')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setAvailableStaffs(d.data.staffs || []);
          setAvailableCustomers(d.data.customers || []);
        }
      })
      .catch(console.error);
  };

  // 3. Load real messages from DB (silent = true avoids spinner flicker)
  const loadRealMessages = (conversationId: string, silent: boolean = false) => {
    if (!silent) setLoadingMessages(true);
    fetch(`/api/messenger/messages?conversationId=${conversationId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setMessages(prev => {
            // Compare message IDs and content strictly to avoid re-rendering React DOM when data is identical
            if (
              prev.length === data.data.length &&
              prev.every(
                (m, idx) =>
                  m.id === data.data[idx]?.id &&
                  m.content === data.data[idx]?.content &&
                  (m.attachments?.length || 0) === (data.data[idx]?.attachments?.length || 0)
              )
            ) {
              return prev;
            }
            return data.data;
          });
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!silent) setLoadingMessages(false);
      });
  };

  // Auto poll for new messages in active chat every 3 seconds silently
  useEffect(() => {
    if (!activeChatId) return;

    const msgInterval = setInterval(() => {
      loadRealMessages(activeChatId, true);
    }, 3000);

    return () => clearInterval(msgInterval);
  }, [activeChatId]);

  // Only scroll when message count increases (zero scroll jumping / flicker)
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMsgCountRef.current = messages.length;
  }, [messages.length]);

  // Handler: Toggle Archive Conversation
  const handleToggleArchive = async (conversationId: string, currentArchived: boolean) => {
    try {
      const res = await fetch('/api/messenger/conversations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, isArchived: !currentArchived }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(currentArchived ? 'Đã chuyển cuộc trò chuyện về hộp thư chính' : 'Đã chuyển cuộc trò chuyện vào Mục Lưu Trữ');
        loadConversations(true, true);
      } else {
        toast.error('Lỗi: ' + data.error);
      }
    } catch (err: any) {
      toast.error('Lỗi kết nối: ' + err.message);
    }
  };

  // Handler: Delete Entire Conversation
  const handleDeleteConversation = async (conversationId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn cuộc trò chuyện này cùng toàn bộ tin nhắn?')) return;
    try {
      const res = await fetch(`/api/messenger/conversations?conversationId=${conversationId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Đã xóa cuộc trò chuyện');
        setActiveChatId(null);
        setMessages([]);
        loadConversations(false, false);
      } else {
        toast.error('Lỗi xóa: ' + data.error);
      }
    } catch (err: any) {
      toast.error('Lỗi kết nối: ' + err.message);
    }
  };

  // Handler: Delete Single Message
  const handleDeleteMessage = async (messageId: string) => {
    try {
      const res = await fetch(`/api/messenger/messages?messageId=${messageId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
        toast.success('Đã xóa tin nhắn');
      } else {
        toast.error('Lỗi xóa tin nhắn: ' + data.error);
      }
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    }
  };

  // Handler: Claim / Release / Resolve Conversation Assignment
  const handleAssignConversation = async (
    conversationId: string,
    action: 'claim' | 'release' | 'resolve'
  ) => {
    try {
      const res = await fetch('/api/messenger/conversations/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, action }),
      });
      const data = await res.json();
      if (data.success) {
        if (action === 'claim') toast.success('⚡ Đã tiếp nhận phụ trách cuộc trò chuyện!');
        else if (action === 'release') toast.info('🔓 Đã trả cuộc trò chuyện về Hàng Đợi Chờ');
        else if (action === 'resolve') toast.success('✅ Đã đánh dấu hoàn thành phiên tư vấn!');
        
        loadConversations(true, true);
        if (activeChatId) loadRealMessages(activeChatId, true);
      } else {
        toast.error(data.error || 'Thao tác thất bại');
      }
    } catch (err: any) {
      toast.error('Lỗi kết nối: ' + err.message);
    }
  };

  // File handlers: Add, remove, clipboard paste, drag-and-drop
  const handleAddFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const newPreviews = fileArray.map(file => ({
      file,
      url: URL.createObjectURL(file),
      isImage: file.type.startsWith('image/'),
      name: file.name,
      size: file.size,
    }));

    setPendingFiles(prev => [...prev, ...fileArray]);
    setPendingPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleRemovePendingFile = (index: number) => {
    setPendingPreviews(prev => {
      if (prev[index]) URL.revokeObjectURL(prev[index].url);
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
    setPendingFiles(prev => {
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      handleAddFiles(e.clipboardData.files);
      toast.info(`📋 Đã nhận ${e.clipboardData.files.length} ảnh/tệp từ Clipboard!`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
      toast.info(`📂 Đã nhận ${e.dataTransfer.files.length} tệp kéo thả!`);
    }
  };

  // Image Editor Handlers: Apply Pending, Send to Chat, Save to Dossier
  const handleApplyPendingImage = (blob: Blob, fileName: string) => {
    if (imageEditorTarget?.pendingIndex === undefined) return;
    const idx = imageEditorTarget.pendingIndex;
    const newFile = new File([blob], fileName, { type: 'image/jpeg' });
    const newUrl = URL.createObjectURL(newFile);

    setPendingPreviews(prev => {
      if (prev[idx]) URL.revokeObjectURL(prev[idx].url);
      const next = [...prev];
      next[idx] = {
        file: newFile,
        url: newUrl,
        isImage: true,
        name: fileName,
        size: newFile.size,
      };
      return next;
    });

    setPendingFiles(prev => {
      const next = [...prev];
      next[idx] = newFile;
      return next;
    });
  };

  const handleSendEditedImageToChat = async (
    blob: Blob,
    fileName: string,
    metadata?: { originalUrl?: string; originalName?: string }
  ) => {
    if (!activeChat) return;
    const file = new File([blob], fileName, { type: 'image/jpeg' });
    const fd = new FormData();
    fd.append('files', file);

    const upRes = await fetch('/api/messenger/upload', {
      method: 'POST',
      body: fd,
    });
    const upData = await upRes.json();
    if (!upData.success || !Array.isArray(upData.data) || upData.data.length === 0) {
      throw new Error(upData.error || 'Tải ảnh lên máy chủ thất bại');
    }

    const uploadedAtt = upData.data[0];
    const finalAttachment: ChatAttachment = {
      ...uploadedAtt,
      isEdited: true,
      originalUrl: metadata?.originalUrl || imageEditorTarget?.originalUrl || imageEditorTarget?.url,
      originalName: metadata?.originalName || imageEditorTarget?.originalName || imageEditorTarget?.name,
      originalSize: imageEditorTarget?.originalSize || imageEditorTarget?.size,
    };

    const res = await fetch('/api/messenger/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: activeChat.id,
        content: `[Ảnh đã xử lý & cắt xoay: ${fileName}]`,
        attachments: [finalAttachment],
      }),
    });

    const data = await res.json();
    if (data.success && data.data) {
      setMessages(prev => [...prev, data.data]);
      setConversations(prev =>
        prev.map(c => (c.id === activeChat.id ? { ...c, lastMessage: `[Đã gửi ảnh đã chỉnh sửa: ${fileName}]` } : c))
      );
    } else {
      throw new Error(data.error || 'Không thể gửi tin nhắn');
    }
  };

  const handleSaveEditedImageToDossier = async (blob: Blob, fileName: string) => {
    const loadId = toast.loading('Đang chuẩn bị ảnh đã cắt xoay để lưu hồ sơ...');
    try {
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      const fd = new FormData();
      fd.append('files', file);

      const upRes = await fetch('/api/messenger/upload', {
        method: 'POST',
        body: fd,
      });
      const upData = await upRes.json();
      if (!upData.success || !Array.isArray(upData.data) || upData.data.length === 0) {
        throw new Error(upData.error || 'Tải ảnh lên máy chủ thất bại');
      }

      const uploadedAtt = upData.data[0];
      toast.dismiss(loadId);
      setSelectedAttachmentForDossier({
        url: uploadedAtt.url,
        name: uploadedAtt.name,
        size: uploadedAtt.size,
        type: uploadedAtt.type,
        originalUrl: imageEditorTarget?.originalUrl || imageEditorTarget?.url,
        originalName: imageEditorTarget?.originalName || imageEditorTarget?.name,
        originalSize: imageEditorTarget?.originalSize || imageEditorTarget?.size,
        isEdited: true,
      });
    } catch (err: any) {
      toast.error('Lỗi khi chuẩn bị ảnh hồ sơ: ' + err.message, { id: loadId });
    }
  };

  // Delete raw original image from storage to save space
  const handleDeleteOriginalImage = async (messageId: string, originalUrl: string, fileName?: string) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc muốn XÓA VĨNH VIỄN tệp ảnh gốc "${fileName || 'bản gốc'}" trên máy chủ để tiết kiệm dung lượng?\n\n` +
      `Lưu ý:\n- Bản ảnh đã cắt xoay vẫn được bảo tồn 100% trong cuộc trò chuyện.\n- Thao tác này sẽ giải phóng dung lượng lưu trữ trên máy chủ.`
    );
    if (!confirmDelete) return;

    const loadId = toast.loading('Đang xóa tệp ảnh gốc để giải phóng dung lượng...');
    try {
      const res = await fetch('/api/messenger/attachments/delete-original', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, originalUrl }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Đã xóa tệp ảnh gốc thành công! Dung lượng lưu trữ đã được giải phóng.', { id: loadId });
        // Update local state
        setMessages(prev =>
          prev.map(m => {
            if (m.id === messageId && m.attachments) {
              return {
                ...m,
                attachments: m.attachments.map(att => {
                  if (att.originalUrl === originalUrl || att.url === originalUrl) {
                    return { ...att, originalUrl: null, originalPurged: true };
                  }
                  return att;
                }),
              };
            }
            return m;
          })
        );
        if (lightboxMetadata?.originalUrl === originalUrl) {
          setLightboxMetadata(prev => prev ? { ...prev, originalUrl: null, originalPurged: true } : null);
        }
      } else {
        toast.error('Lỗi khi xóa ảnh gốc: ' + (data.error || 'Thất bại'), { id: loadId });
      }
    } catch (err: any) {
      toast.error('Lỗi kết nối: ' + err.message, { id: loadId });
    }
  };

  // 4. Send real message with optional uncompressed attachments
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && pendingFiles.length === 0) || !activeChat) return;

    const textToSend = inputText.trim();
    const filesToUpload = [...pendingFiles];

    setInputText('');
    setPendingFiles([]);
    setPendingPreviews([]);

    let uploadedAttachments: ChatAttachment[] = [];

    if (filesToUpload.length > 0) {
      setUploadingFiles(true);
      const loadingToast = toast.loading(`Đang tải lên ${filesToUpload.length} tệp nguyên bản không nén...`);
      try {
        const fd = new FormData();
        filesToUpload.forEach(f => fd.append('files', f));

        const upRes = await fetch('/api/messenger/upload', {
          method: 'POST',
          body: fd,
        });
        const upData = await upRes.json();
        if (upData.success && Array.isArray(upData.data)) {
          uploadedAttachments = upData.data;
          toast.success(`Đã tải lên ${upData.data.length} tệp thành công!`, { id: loadingToast });
        } else {
          toast.error('Lỗi tải tệp: ' + (upData.error || 'Thất bại'), { id: loadingToast });
          setUploadingFiles(false);
          return;
        }
      } catch (err: any) {
        toast.error('Lỗi tải tệp: ' + err.message, { id: loadingToast });
        setUploadingFiles(false);
        return;
      } finally {
        setUploadingFiles(false);
      }
    }

    try {
      const res = await fetch('/api/messenger/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeChat.id,
          content: textToSend,
          attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setMessages(prev => [...prev, data.data]);
        const displayLast = textToSend || (uploadedAttachments.length > 0 ? `[Đã gửi ${uploadedAttachments.length} tệp đính kèm]` : '');
        // Update last message on left panel
        setConversations(prev =>
          prev.map(c => (c.id === activeChat.id ? { ...c, lastMessage: displayLast } : c))
        );
      } else {
        toast.error('Không thể gửi tin nhắn: ' + (data.error || 'Lỗi hệ thống'));
      }
    } catch (err: any) {
      toast.error('Lỗi kết nối: ' + err.message);
    }
  };

  // 5. Create real Group Chat
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.warning('Vui lòng nhập tên nhóm chat');
      return;
    }

    if (selectedUserIds.length === 0 && selectedCustomerIds.length === 0) {
      toast.warning('Vui lòng chọn ít nhất 1 thành viên tham gia nhóm');
      return;
    }

    setCreatingGroup(true);
    try {
      const res = await fetch('/api/messenger/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `👥 ${groupName.trim()}`,
          type: 'GROUP',
          userIds: selectedUserIds,
          customerIds: selectedCustomerIds,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Đã tạo thành công nhóm chat: ${groupName.trim()}`);
        setShowCreateGroupModal(false);
        setGroupName('');
        setSelectedUserIds([]);
        setSelectedCustomerIds([]);
        loadConversations();
      } else {
        toast.error('Tạo nhóm thất bại: ' + (data.error || 'Lỗi hệ thống'));
      }
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setCreatingGroup(false);
    }
  };

  // Handler: Open conversation by ID (used by QuickNewChatModal)
  const handleOpenConversationById = (conversationId: string) => {
    loadConversations(true, false);
    setActiveChatId(conversationId);
    loadRealMessages(conversationId);
    setMobileView('chat');
  };

  // Handler: Open or create instant 1-on-1 Direct Chat with staff or customer
  const handleOpenDirectChat = async (target: MemberItem) => {
    try {
      const res = await fetch('/api/messenger/conversations/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          target.type === 'STAFF'
            ? { targetUserId: target.id }
            : { targetCustomerId: target.id }
        ),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const directConv: ChatConversation = data.data;
        setConversations(prev => {
          const exists = prev.find(c => c.id === directConv.id);
          if (exists) {
            return prev.map(c => c.id === directConv.id ? { ...c, ...directConv } : c);
          }
          return [directConv, ...prev];
        });
        setActiveChatId(data.data.id);
        loadRealMessages(data.data.id);
        loadConversations(true, true);
        setMobileView('chat');
        setShowQuickNewChatModal(false);
        toast.success(`Đã mở cuộc trò chuyện 1-1 với ${target.name}`);
      } else {
        toast.error(data.error || 'Không thể mở cuộc trò chuyện');
      }
    } catch (err: any) {
      toast.error('Lỗi kết nối: ' + err.message);
    }
  };

  // Helper: compute dossier / profile URL for active chat counterpart
  const getDossierUrl = (chat: ChatConversation | null) => {
    if (!chat) return null;
    const matchedStaff = availableStaffs.find(s => s.name === chat.name || (chat.code && s.code === chat.code));
    const isStaff = !!matchedStaff || chat.type === 'DIRECT' || chat.role === 'ADMIN' || chat.role === 'MANAGER' || (chat.code && chat.code.startsWith('NV'));

    if (isStaff) {
      return `/hr?q=${encodeURIComponent(chat.name)}`;
    }
    // Customer
    if (chat.applicationId) {
      return `/applications/${chat.applicationId}`;
    }
    if (chat.code) {
      return `/applications?q=${encodeURIComponent(chat.code)}`;
    }
    if (chat.customerId) {
      return `/applications?q=${encodeURIComponent(chat.name)}`;
    }
    return `/applications?q=${encodeURIComponent(chat.name)}`;
  };

  const handleOpenDossierNewTab = () => {
    const url = getDossierUrl(activeChat);
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenDossierAndDockChat = () => {
    if (!activeChat) return;
    const url = getDossierUrl(activeChat);
    if (!url) return;

    const matchedStaff = availableStaffs.find(s => s.name === activeChat.name || (activeChat.code && s.code === activeChat.code));
    const isStaff = !!matchedStaff || activeChat.type === 'DIRECT' || activeChat.role === 'ADMIN' || activeChat.role === 'MANAGER' || (activeChat.code && activeChat.code.startsWith('NV'));
    const roleTitle = matchedStaff?.role || (activeChat.role === 'ADMIN' ? 'Quản trị viên' : activeChat.role === 'MANAGER' ? 'Quản lý' : activeChat.role === 'CTV' || activeChat.type === 'CTV' ? 'Cộng tác viên (CTV)' : isStaff ? 'Nhân viên nội bộ' : 'Khách hàng');

    const dockData = {
      conversationId: activeChat.id,
      name: activeChat.name,
      code: activeChat.code || matchedStaff?.code || '',
      role: roleTitle,
      isStaff,
      isOnline: activeChat.isOnline,
      isOpen: true,
      isMinimized: false,
      targetUrl: url,
    };

    try {
      localStorage.setItem('nenkin_docked_chat', JSON.stringify(dockData));
      window.dispatchEvent(new Event('nenkin:dock-chat'));
    } catch (e) {
      console.error(e);
    }

    router.push(url);
  };

  const filteredChats = conversations
    .filter(c => {
      if (chatCategory === 'ARCHIVED') return c.isArchived === true;
      if (c.isArchived === true) return false;
      if (chatCategory === 'CUSTOMER') return c.type === 'CUSTOMER' || c.type === 'CUSTOMER_SUPPORT' || (c.type === 'DIRECT' && Boolean(c.customerId));
      if (chatCategory === 'CTV') return c.type === 'CTV' || (c.type === 'DIRECT' && !c.customerId);
      return c.type === chatCategory;
    })
    .filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Filter members in directory tab
  const filteredDirectoryMembers = (directoryCategoryTab === 'STAFF' ? availableStaffs : availableCustomers).filter(m =>
    m.name.toLowerCase().includes(directorySearchQuery.toLowerCase()) ||
    m.code?.toLowerCase().includes(directorySearchQuery.toLowerCase()) ||
    (m.phone && m.phone.includes(directorySearchQuery))
  );

  // Filter members in modal
  const filteredModalMembers = (memberCategoryTab === 'STAFF' ? availableStaffs : availableCustomers).filter(m =>
    m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
    m.code?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
    (m.phone && m.phone.includes(memberSearchQuery))
  );

  return (
    <div className="h-[calc(100vh-85px)] md:h-[calc(100vh-80px)] max-w-full overflow-x-hidden pb-20 md:pb-0 bg-white border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden flex min-h-0 relative">
      
      {/* ── LEFT COL: CHAT CATEGORIES & LIST OR CONTACTS DIRECTORY ── */}
      <div className={`w-full md:w-80 lg:w-80 border-r border-slate-200/80 flex flex-col min-h-0 bg-white shrink-0 ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Sidebar Header */}
        <div className="p-2.5 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-indigo-700 rounded-xl text-white shadow-xs shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-extrabold text-xs text-slate-800 tracking-tight truncate">Nenkin Messenger</h2>
              <span className="text-[10px] text-slate-400 block font-medium truncate">VietNenkin Duyên Hub</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setShowQuickNewChatModal(true)}
              className="px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-colors flex items-center gap-1 text-[11px] font-bold shadow-2xs border border-indigo-100"
              title="Soạn tin nhắn 1-1 nhanh"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Soạn tin</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCreateGroupModal(true)}
              className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl transition-colors flex items-center gap-1 text-[11px] font-bold shadow-2xs border border-purple-100"
              title="Tạo nhóm chat mới"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Master Navigation Tab: Inbox vs Contacts */}
        <div className="grid grid-cols-2 p-1 bg-slate-100/80 border-b border-slate-200/80 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setSidebarView('INBOX')}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              sidebarView === 'INBOX'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Hộp Thư</span>
          </button>
          <button
            type="button"
            onClick={() => setSidebarView('CONTACTS')}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              sidebarView === 'CONTACTS'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <BookUser className="w-3.5 h-3.5" />
            <span>Danh Bạ ({availableStaffs.length + availableCustomers.length})</span>
          </button>
        </div>

        {sidebarView === 'INBOX' ? (
          <>
            {/* 4 Segmented Category Tabs */}
            <div className="p-1.5 bg-slate-100/70 border-b border-slate-200/80 grid grid-cols-4 gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setChatCategory('CUSTOMER');
                  const first = conversations.find(c => !c.isArchived && (c.type === 'CUSTOMER' || c.type === 'CUSTOMER_SUPPORT' || (c.type === 'DIRECT' && Boolean(c.customerId))));
                  if (first) { setActiveChatId(first.id); loadRealMessages(first.id); }
                }}
                className={`py-1.5 text-[10px] font-bold rounded-lg transition-all text-center truncate ${
                  chatCategory === 'CUSTOMER' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
                }`}
              >
                👤 Khách ({conversations.filter(c => !c.isArchived && (c.type === 'CUSTOMER' || c.type === 'CUSTOMER_SUPPORT' || (c.type === 'DIRECT' && Boolean(c.customerId)))).length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setChatCategory('CTV');
                  const first = conversations.find(c => !c.isArchived && (c.type === 'CTV' || (c.type === 'DIRECT' && !c.customerId)));
                  if (first) { setActiveChatId(first.id); loadRealMessages(first.id); }
                }}
                className={`py-1.5 text-[10px] font-bold rounded-lg transition-all text-center truncate ${
                  chatCategory === 'CTV' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
                }`}
              >
                🤝 CTV ({conversations.filter(c => !c.isArchived && (c.type === 'CTV' || (c.type === 'DIRECT' && !c.customerId))).length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setChatCategory('GROUP');
                  const first = conversations.find(c => !c.isArchived && c.type === 'GROUP');
                  if (first) { setActiveChatId(first.id); loadRealMessages(first.id); }
                }}
                className={`py-1.5 text-[10px] font-bold rounded-lg transition-all text-center truncate ${
                  chatCategory === 'GROUP' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
                }`}
              >
                👥 Nhóm ({conversations.filter(c => !c.isArchived && c.type === 'GROUP').length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setChatCategory('ARCHIVED');
                  const first = conversations.find(c => c.isArchived === true);
                  if (first) { setActiveChatId(first.id); loadRealMessages(first.id); }
                }}
                className={`py-1.5 text-[10px] font-bold rounded-lg transition-all text-center truncate ${
                  chatCategory === 'ARCHIVED' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
                }`}
              >
                📁 Kho ({conversations.filter(c => c.isArchived === true).length})
              </button>
            </div>

            {/* Search Inbox */}
            <div className="p-2 bg-white border-b border-slate-100 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm tin nhắn, tên CTV, khách..."
                  className="pl-7 text-xs bg-slate-50 border-slate-200 rounded-xl h-8 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100/80 min-h-0">
              {loadingChats ? (
                <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
                  <span className="text-xs font-medium">Đang tải cuộc trò chuyện...</span>
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 italic">Chưa có cuộc trò chuyện nào</div>
              ) : (
                filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => {
                      setActiveChatId(chat.id);
                      loadRealMessages(chat.id);
                      setMobileView('chat');
                    }}
                    className={`p-3 flex items-center gap-2.5 cursor-pointer transition-all ${
                      activeChatId === chat.id
                        ? 'bg-blue-50/95 border-l-4 border-blue-600 shadow-2xs'
                        : 'hover:bg-slate-50/80 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border ${
                        activeChatId === chat.id
                          ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                          : chat.type === 'GROUP'
                          ? 'bg-violet-100 text-violet-700 border-violet-200'
                          : getAvatarColor(chat.name)
                      }`}>
                        {chat.type === 'GROUP' ? <Users className="w-4 h-4" /> : (chat.name?.[0] || 'K')}
                      </div>
                      <span className={`w-2.5 h-2.5 rounded-full border-2 border-white absolute bottom-0 right-0 ${
                        chat.isOnline ? 'bg-emerald-500 animate-pulse ring-1 ring-emerald-200' : 'bg-slate-300'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className={`font-bold text-xs truncate flex items-center gap-1 ${
                          activeChatId === chat.id ? 'text-blue-700' : 'text-slate-800'
                        }`}>
                          {chat.name}
                          {chat.type === 'CUSTOMER_SUPPORT' && <span className="px-1.5 py-0.2 bg-teal-100 text-teal-800 text-[8px] font-bold rounded">Tư vấn</span>}
                        </h4>
                        <div className="flex items-center gap-1 shrink-0">
                          {activeChatId === chat.id && (
                            <span className="px-1.5 py-0.2 bg-blue-600 text-white text-[8px] font-bold rounded-full shrink-0 shadow-2xs animate-in fade-in">
                              Đang chọn
                            </span>
                          )}
                          {chat.code && <span className="text-[9px] font-mono text-slate-400 shrink-0">#{chat.code}</span>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <p className={`text-[11px] truncate flex-1 ${activeChatId === chat.id ? 'text-blue-900/80 font-medium' : 'text-slate-500'}`}>
                          {chat.lastMessage}
                        </p>
                        {chat.isArchived ? (
                          <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 text-[8px] font-bold rounded shrink-0">Đã lưu</span>
                        ) : chat.supportStatus === 'UNASSIGNED' ? (
                          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[8px] font-bold rounded border border-amber-300 shrink-0">Chờ nhận</span>
                        ) : chat.supportStatus === 'ASSIGNED' ? (
                          <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[8px] font-bold rounded shrink-0">{chat.assignedUserName || 'Đã có NV'}</span>
                        ) : chat.supportStatus === 'RESOLVED' ? (
                          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[8px] font-bold rounded shrink-0">Đã xong</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          /* CONTACTS TAB VIEW */
          <div className="flex-1 flex flex-col min-h-0 bg-white">
            {/* Category switch: STAFF vs CUSTOMER */}
            <div className="p-1.5 bg-slate-100/90 border-b border-slate-200/80 grid grid-cols-2 gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setDirectoryCategoryTab('STAFF')}
                className={`py-1.5 text-[11px] font-bold rounded-lg transition-all text-center truncate ${
                  directoryCategoryTab === 'STAFF' ? 'bg-white text-slate-900 shadow-xs border border-slate-200/70' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                🤝 CTV & NV ({availableStaffs.length})
              </button>
              <button
                type="button"
                onClick={() => setDirectoryCategoryTab('CUSTOMER')}
                className={`py-1.5 text-[11px] font-bold rounded-lg transition-all text-center truncate ${
                  directoryCategoryTab === 'CUSTOMER' ? 'bg-white text-slate-900 shadow-xs border border-slate-200/70' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                👤 Khách Hàng ({availableCustomers.length})
              </button>
            </div>

            {/* Search Directory */}
            <div className="p-2 bg-white border-b border-slate-100 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  value={directorySearchQuery}
                  onChange={e => setDirectorySearchQuery(e.target.value)}
                  placeholder={`Tìm ${directoryCategoryTab === 'STAFF' ? 'nhân viên, CTV' : 'khách hàng'} theo tên, mã, SĐT...`}
                  className="pl-7 text-xs bg-slate-50 border-slate-200 rounded-xl h-8 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Directory Member List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100/80 min-h-0">
              {filteredDirectoryMembers.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 italic">Không tìm thấy danh bạ phù hợp</div>
              ) : (
                filteredDirectoryMembers.map((m) => {
                  const isMemberActive = !!activeChat && (
                    (activeChat.customerId && activeChat.customerId === m.id) ||
                    (activeChat.code && m.code && activeChat.code === m.code) ||
                    activeChat.name === m.name
                  );

                  return (
                    <div
                      key={m.id}
                      onClick={() => handleOpenDirectChat(m)}
                      className={`p-2.5 sm:p-3 flex items-center justify-between gap-2.5 transition-all cursor-pointer group ${
                        isMemberActive
                          ? 'bg-blue-50/95 border-l-4 border-blue-600 shadow-2xs font-semibold'
                          : 'hover:bg-slate-50/90 active:bg-slate-100/80 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Avatar with Online Status Dot */}
                        <div className="relative shrink-0">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border ${
                            isMemberActive
                              ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                              : getAvatarColor(m.name)
                          }`}>
                            {m.name?.[0] || 'U'}
                          </div>
                          <span className={`w-2.5 h-2.5 rounded-full border-2 border-white absolute bottom-0 right-0 ${
                            m.isOnline ? 'bg-emerald-500 animate-pulse ring-1 ring-emerald-200' : 'bg-slate-300'
                          }`} />
                        </div>

                        {/* Info: Name, Role, Online Status */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 justify-between">
                            <span className={`font-bold text-xs truncate transition-colors ${
                              isMemberActive ? 'text-blue-700' : 'text-slate-800 group-hover:text-blue-600'
                            }`}>
                              {m.name}
                            </span>
                            {m.type === 'STAFF' && m.role && (
                              <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-medium rounded shrink-0">
                                {m.role}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-1 mt-0.5">
                            <p className={`text-[10px] truncate flex items-center gap-1 ${
                              m.isOnline ? 'text-emerald-600 font-semibold' : 'text-slate-400 font-normal'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                              <span>{m.isOnline ? 'Đang hoạt động' : (m.lastActiveText || 'Ngoại tuyến')}</span>
                            </p>
                            <span className="text-[9px] font-mono text-slate-400 shrink-0">
                              {m.code ? `#${m.code}` : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Subtle Action on Hover or Active Badge */}
                      <div className="shrink-0 pl-1">
                        {isMemberActive ? (
                          <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-bold shadow-2xs animate-in fade-in flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            Đang chat
                          </span>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-600 flex items-center justify-center transition-colors shadow-2xs">
                            <MessageSquare className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── MIDDLE COL: ACTIVE CHAT CONVERSATION WINDOW ── */}
      <div className={`flex-1 flex flex-col min-h-0 bg-slate-50/70 ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
        
        {activeChat ? (
          <>
            {/* Redesigned Active Chat Topbar (Facebook & Zalo Standard) */}
            <div className="px-3.5 py-2.5 bg-white border-b border-slate-200/90 flex items-center justify-between shrink-0 shadow-2xs gap-2">
              
              {/* Left: Info & Mobile Back Button */}
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setMobileView('list')}
                  className="md:hidden p-1.5 hover:bg-slate-100 rounded-xl text-indigo-600 transition-colors flex items-center text-xs font-bold shrink-0 border border-indigo-100 bg-indigo-50/50"
                  title="Quay lại danh sách"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs border ${
                  activeChat.type === 'GROUP' ? 'bg-violet-100 text-violet-700 border-violet-200' : getAvatarColor(activeChat.name)
                }`}>
                  {activeChat.type === 'GROUP' ? <Users className="w-4 h-4" /> : activeChat.name?.[0]}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-bold text-xs text-slate-900 truncate">{activeChat.name}</h3>
                    
                    {/* Category Pill Tag */}
                    {(() => {
                      const matchedStaff = availableStaffs.find(s => s.name === activeChat.name || (activeChat.code && s.code === activeChat.code));
                      const roleTag = matchedStaff?.role || activeChat.role;
                      if (roleTag) {
                        return (
                          <span className="px-1.5 py-0.2 rounded-md bg-blue-50 text-blue-700 text-[9px] font-bold border border-blue-200">
                            {roleTag}
                          </span>
                        );
                      }
                      if (activeChat.type === 'CUSTOMER_SUPPORT') {
                        return (
                          <span className="px-1.5 py-0.2 rounded-md bg-teal-50 text-teal-700 text-[9px] font-bold border border-teal-200">
                            Tư vấn Trực tiếp
                          </span>
                        );
                      }
                      if (activeChat.type === 'CTV') {
                        return (
                          <span className="px-1.5 py-0.2 rounded-md bg-purple-50 text-purple-700 text-[9px] font-bold border border-purple-200">
                            CTV
                          </span>
                        );
                      }
                      if (activeChat.type === 'GROUP') {
                        return (
                          <span className="px-1.5 py-0.2 rounded-md bg-violet-50 text-violet-700 text-[9px] font-bold border border-violet-200">
                            Nhóm ({activeChat.membersCount || 2} TV)
                          </span>
                        );
                      }
                      return null;
                    })()}

                    {/* Support Status Pill Tag - ONLY for CUSTOMER_SUPPORT type */}
                    {activeChat.type === 'CUSTOMER_SUPPORT' && (
                      activeChat.supportStatus === 'UNASSIGNED' ? (
                        <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 font-bold text-[9px] border border-amber-300">
                          Chờ tiếp nhận
                        </span>
                      ) : activeChat.supportStatus === 'ASSIGNED' ? (
                        <span className="px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-800 font-bold text-[9px] border border-blue-300">
                          {activeChat.assignedUserName || 'Chuyên viên phụ trách'}
                        </span>
                      ) : activeChat.supportStatus === 'RESOLVED' ? (
                        <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[9px] border border-emerald-300">
                          Đã xong
                        </span>
                      ) : null
                    )}
                  </div>

                  <p className="text-[10px] flex items-center gap-1 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      activeChat.isOnline
                        ? 'bg-emerald-500 animate-pulse'
                        : activeChat.type === 'CUSTOMER_SUPPORT' && activeChat.supportStatus !== 'RESOLVED'
                        ? 'bg-amber-400'
                        : 'bg-slate-300'
                    }`} />
                    <span className={
                      activeChat.isOnline
                        ? 'text-emerald-600 font-bold'
                        : activeChat.type === 'CUSTOMER_SUPPORT' && activeChat.supportStatus !== 'RESOLVED'
                        ? 'text-amber-600 font-medium'
                        : 'text-slate-400 font-normal'
                    }>
                      {activeChat.lastActiveText || (activeChat.isOnline ? 'Đang hoạt động' : 'Ngoại tuyến')}
                    </span>
                    {activeChat.code ? ` • Mã: #${activeChat.code}` : ''}
                  </p>
                </div>
              </div>

              {/* Right: Unified Action Toolbar (Clean h-8 buttons) */}
              <div className="flex items-center gap-1.5 shrink-0">
                
                {/* Primary Assignment Action Button - ONLY for CUSTOMER_SUPPORT type */}
                {activeChat.type === 'CUSTOMER_SUPPORT' && (
                  activeChat.supportStatus === 'UNASSIGNED' ? (
                    <button
                      type="button"
                      onClick={() => handleAssignConversation(activeChat.id, 'claim')}
                      className="h-8 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 animate-pulse"
                      title="Tiếp nhận phụ trách cuộc trò chuyện này"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span className="hidden sm:inline">Tiếp Nhận Chat</span>
                      <span className="sm:hidden">Nhận</span>
                    </button>
                  ) : activeChat.supportStatus === 'ASSIGNED' ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleAssignConversation(activeChat.id, 'release')}
                        className="h-8 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 border border-slate-200 transition-colors"
                        title="Trả cuộc trò chuyện về hàng đợi chờ"
                      >
                        <Unlock className="w-3.5 h-3.5 text-slate-600" />
                        <span className="hidden md:inline">Trả Hàng Đợi</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAssignConversation(activeChat.id, 'resolve')}
                        className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                        title="Đánh dấu hoàn thành hỗ trợ"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Hoàn Thành</span>
                      </button>
                    </div>
                  ) : null
                )}

                {/* Dossier Quick Access Buttons (Profile Link + Mini Docked Chat) */}
                {activeChat.type !== 'GROUP' && (
                  <div className="flex items-center gap-1 bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/80">
                    <button
                      type="button"
                      onClick={handleOpenDossierAndDockChat}
                      className="h-7 px-2.5 bg-white hover:bg-blue-50 text-blue-700 hover:text-blue-800 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs border border-slate-200/60 transition-all"
                      title="Mở hồ sơ tại tab này & thu nhỏ chat nổi (Facebook Messenger style) để vừa duyệt vừa trao đổi"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span className="hidden sm:inline">
                        {(() => {
                          const matchedStaff = availableStaffs.find(s => s.name === activeChat.name || (activeChat.code && s.code === activeChat.code));
                          const isStaff = !!matchedStaff || activeChat.type === 'DIRECT' || activeChat.role === 'ADMIN' || activeChat.role === 'MANAGER' || (activeChat.code && activeChat.code.startsWith('NV'));
                          return isStaff ? 'Hồ Sơ NV' : 'Hồ Sơ Khách';
                        })()}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenDossierNewTab}
                      className="h-7 w-7 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 rounded-lg flex items-center justify-center transition-colors"
                      title="Mở hồ sơ ở tab mới"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Add Member Button - invite anyone into this chat */}
                <button
                  type="button"
                  onClick={() => setShowAddMembersModal(true)}
                  className="h-8 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1 border border-indigo-200 transition-colors shadow-2xs"
                  title="Mời thêm đồng nghiệp hoặc khách vào cuộc trò chuyện này"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Thêm Người</span>
                </button>

                {/* Archive Button */}
                <button
                  type="button"
                  onClick={() => handleToggleArchive(activeChat.id, activeChat.isArchived || false)}
                  className="h-8 w-8 hover:bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center border border-slate-200/90 transition-colors"
                  title={activeChat.isArchived ? "Bỏ lưu trữ" : "Lưu trữ cuộc trò chuyện"}
                >
                  {activeChat.isArchived ? <ArchiveRestore className="w-4 h-4 text-emerald-600" /> : <Archive className="w-4 h-4" />}
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDeleteConversation(activeChat.id)}
                  className="h-8 w-8 hover:bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center border border-rose-200/90 transition-colors"
                  title="Xóa cuộc trò chuyện"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Toggle Right Info Panel */}
                <button
                  type="button"
                  onClick={() => setShowRightPanel(prev => !prev)}
                  className={`h-8 w-8 rounded-xl items-center justify-center border transition-colors hidden xl:flex ${
                    showRightPanel
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                      : 'hover:bg-slate-100 border-slate-200 text-slate-600'
                  }`}
                  title="Bật/Tắt chi tiết cuộc trò chuyện"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Body (Zalo / FB Style Bubbles) */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-slate-50/60 relative"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* Drag & Drop Visual Overlay */}
              {isDraggingOver && (
                <div className="absolute inset-0 z-30 bg-indigo-600/90 backdrop-blur-xs flex flex-col items-center justify-center text-white p-6 border-4 border-dashed border-white/60 m-2 rounded-2xl animate-in fade-in zoom-in-95 pointer-events-none">
                  <UploadCloud className="w-12 h-12 mb-2 animate-bounce" />
                  <h3 className="text-base font-bold">Thả ảnh hoặc tệp vào đây</h3>
                  <p className="text-xs text-indigo-100">Bảo toàn 100% tệp gốc không nén suy hao chi tiết</p>
                </div>
              )}

              {loadingMessages ? (
                <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600 mb-1" />
                  <span className="text-[11px] font-medium">Đang tải tin nhắn...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-2.5">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg border shadow-xs ${
                    activeChat.type === 'GROUP' ? 'bg-violet-100 text-violet-700 border-violet-200' : getAvatarColor(activeChat.name)
                  }`}>
                    {activeChat.type === 'GROUP' ? <Users className="w-6 h-6" /> : activeChat.name?.[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">{activeChat.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                      Bắt đầu cuộc trò chuyện. Nhập tin nhắn hoặc đính kèm tệp hồ sơ bên dưới để trao đổi trực tiếp.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  if (
                    msg.type === 'SYSTEM' ||
                    msg.senderName === 'SYSTEM' ||
                    msg.content.startsWith('⚡') ||
                    msg.content.startsWith('🔓') ||
                    msg.content.startsWith('🔄') ||
                    msg.content.startsWith('✅') ||
                    msg.content.startsWith('Cuộc trò chuyện trực tiếp được khởi tạo') ||
                    msg.content.startsWith('Đã tạo nhóm chat')
                  ) {
                    return (
                      <div key={msg.id} className="flex justify-center my-2">
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-medium rounded-full border border-slate-200 shadow-2xs">
                          {msg.content}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex group items-center gap-1.5 ${msg.isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* Delete Message Button on Hover */}
                      {msg.isMe && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Xóa tin nhắn này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-xs space-y-2 relative ${
                          msg.isMe
                            ? 'bg-blue-600 text-white rounded-tr-xs shadow-2xs'
                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-2xs'
                        }`}
                      >
                        {!msg.isMe && (
                          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1 mb-1">
                            <span className="text-[9px] font-bold text-blue-600 block truncate">{msg.senderName}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-rose-600"
                              title="Xóa tin nhắn"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        {/* Text Content */}
                        {msg.content && (
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        )}

                        {/* Attachments Section */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="space-y-2 pt-1">
                            {(() => {
                              const imageAtts = msg.attachments.filter(att =>
                                att.type?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(att.url)
                              );
                              const docAtts = msg.attachments.filter(att =>
                                !att.type?.startsWith('image/') && !/\.(jpg|jpeg|png|webp|gif)$/i.test(att.url)
                              );

                              return (
                                <>
                                  {/* 1. Images Gallery */}
                                  {imageAtts.length > 0 && (
                                    <div className={`grid gap-2 ${imageAtts.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                      {imageAtts.map((att, attIdx) => (
                                        <div
                                          key={attIdx}
                                          className="relative group/att rounded-xl overflow-hidden border border-black/10 bg-black/5 aspect-4/3 sm:aspect-video flex items-center justify-center"
                                        >
                                          {/* Badge if edited or has original */}
                                          {(att.isEdited || att.originalUrl) && (
                                            <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1">
                                              <span className="px-1.5 py-0.2 rounded bg-indigo-950/85 text-indigo-300 text-[8px] font-bold border border-indigo-700/50 backdrop-blur-xs">
                                                Đã sửa
                                              </span>
                                              {att.originalPurged && (
                                                <span
                                                  className="px-1.5 py-0.2 rounded bg-slate-900/85 text-slate-400 text-[8px] border border-slate-700/50 backdrop-blur-xs"
                                                  title="Đã xóa ảnh gốc để tiết kiệm dung lượng"
                                                >
                                                  Đã dọn gốc
                                                </span>
                                              )}
                                            </div>
                                          )}

                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img
                                            src={att.url}
                                            alt={att.name}
                                            className="w-full h-full object-cover cursor-pointer hover:scale-102 transition-transform duration-150"
                                            onClick={() => {
                                              setLightboxUrl(att.url);
                                              setLightboxMetadata({
                                                name: att.name,
                                                messageId: msg.id,
                                                editedUrl: att.url,
                                                originalUrl: att.originalUrl,
                                                originalName: att.originalName,
                                                isViewingOriginal: false,
                                              });
                                            }}
                                          />

                                          {/* Overlay Action Bar on Hover */}
                                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent p-2 flex items-center justify-between opacity-0 group-hover/att:opacity-100 transition-opacity">
                                            <span className="text-[9px] text-white truncate max-w-[100px]" title={att.name}>
                                              {att.name}
                                            </span>
                                            <div className="flex items-center gap-1 shrink-0">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setLightboxUrl(att.url);
                                                  setLightboxMetadata({
                                                    name: att.name,
                                                    messageId: msg.id,
                                                    editedUrl: att.url,
                                                    originalUrl: att.originalUrl,
                                                    originalName: att.originalName,
                                                    isViewingOriginal: false,
                                                  });
                                                }}
                                                className="p-1 rounded-md bg-white/20 hover:bg-white/40 text-white"
                                                title="Xem phóng to"
                                              >
                                                <Maximize2 className="w-3 h-3" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => setImageEditorTarget({
                                                  url: att.url,
                                                  name: att.name,
                                                  size: att.size,
                                                  messageId: msg.id,
                                                  originalUrl: att.originalUrl || att.url,
                                                  originalName: att.originalName || att.name,
                                                  originalSize: att.originalSize || att.size,
                                                })}
                                                className="p-1 rounded-md bg-white/20 hover:bg-white/40 text-white"
                                                title="Cắt & Xoay ảnh"
                                              >
                                                <Crop className="w-3 h-3" />
                                              </button>
                                              {/* View original if this is an edited image */}
                                              {att.originalUrl && !att.originalPurged && (
                                                <>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      setLightboxUrl(att.originalUrl!);
                                                      setLightboxMetadata({
                                                        name: att.originalName || 'anh_goc.jpg',
                                                        messageId: msg.id,
                                                        editedUrl: att.url,
                                                        originalUrl: att.originalUrl,
                                                        originalName: att.originalName,
                                                        isViewingOriginal: true,
                                                      });
                                                    }}
                                                    className="p-1 rounded-md bg-amber-500/30 hover:bg-amber-500/50 text-amber-200"
                                                    title="Xem ảnh gốc ban đầu"
                                                  >
                                                    <RotateCcw className="w-3 h-3" />
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => handleDeleteOriginalImage(msg.id, att.originalUrl!, att.originalName)}
                                                    className="p-1 rounded-md bg-rose-500/30 hover:bg-rose-500/60 text-rose-200"
                                                    title="Xóa tệp ảnh gốc khỏi máy chủ để tiết kiệm dung lượng"
                                                  >
                                                    <Trash2 className="w-3 h-3" />
                                                  </button>
                                                </>
                                              )}
                                              <a
                                                href={att.url}
                                                download={att.name}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-1 rounded-md bg-white/20 hover:bg-white/40 text-white"
                                                title="Tải ảnh này về máy"
                                              >
                                                <Download className="w-3 h-3" />
                                              </a>
                                              <button
                                                type="button"
                                                onClick={() => setSelectedAttachmentForDossier({
                                                  url: att.url,
                                                  name: att.name,
                                                  size: att.size,
                                                  type: att.type,
                                                })}
                                                className="px-2 py-0.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-bold flex items-center gap-0.5 shadow-xs"
                                                title="Lưu vào hồ sơ khách hàng"
                                              >
                                                <FolderPlus className="w-3 h-3" /> Lưu HS
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* 2. Documents (PDF, zip, etc.) */}
                                  {docAtts.length > 0 && (
                                    <div className="space-y-1.5">
                                      {docAtts.map((att, attIdx) => (
                                        <div
                                          key={attIdx}
                                          className={`p-2 rounded-xl border flex items-center justify-between gap-2.5 ${
                                            msg.isMe
                                              ? 'bg-indigo-700/50 border-indigo-400/40 text-white'
                                              : 'bg-slate-50 border-slate-200 text-slate-800'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
                                              <FileText className="w-3.5 h-3.5 text-current" />
                                            </div>
                                            <div className="min-w-0">
                                              <p className="font-bold text-[11px] truncate max-w-[130px] sm:max-w-[180px]" title={att.name}>
                                                {att.name}
                                              </p>
                                              <span className="text-[9px] opacity-75 font-mono">
                                                {att.size ? `${(att.size / 1024 / 1024).toFixed(2)} MB` : 'Tài liệu gốc'}
                                              </span>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-1 shrink-0">
                                            <a
                                              href={att.url}
                                              download={att.name}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="p-1 rounded-md bg-white/20 hover:bg-white/30 text-current"
                                              title="Tải tệp gốc"
                                            >
                                              <Download className="w-3 h-3" />
                                            </a>
                                            <button
                                              type="button"
                                              onClick={() => setSelectedAttachmentForDossier({
                                                url: att.url,
                                                name: att.name,
                                                size: att.size,
                                                type: att.type,
                                              })}
                                              className="p-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white"
                                              title="Lưu vào hồ sơ khách hàng"
                                            >
                                              <FolderPlus className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}

                        <span
                          className={`text-[8px] font-mono block text-right ${
                            msg.isMe ? 'text-blue-100 opacity-90' : 'text-slate-400'
                          }`}
                        >
                          {msg.time}
                        </span>
                      </div>

                      {!msg.isMe && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Xóa tin nhắn này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Pending Attachments Strip */}
            {pendingPreviews.length > 0 && (
              <div className="px-3 py-2 bg-slate-100/90 border-t border-slate-200/80 flex items-center gap-2 overflow-x-auto shrink-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                  Đính kèm ({pendingPreviews.length}):
                </span>
                {pendingPreviews.map((p, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-lg overflow-hidden border border-slate-300 bg-white shrink-0 flex items-center gap-1.5 p-1 pr-2 max-w-[180px]"
                  >
                    {p.isImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.url} alt={p.name} className="w-7 h-7 rounded object-cover shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <span className="text-[10px] font-semibold text-slate-700 truncate min-w-0" title={p.name}>
                      {p.name}
                    </span>
                    {p.isImage && (
                      <button
                        type="button"
                        onClick={() => setImageEditorTarget({
                          url: p.url,
                          name: p.name,
                          isPending: true,
                          pendingIndex: idx,
                        })}
                        className="text-slate-400 hover:text-indigo-600 p-0.5 rounded"
                        title="Cắt & Xoay ảnh trước khi gửi"
                      >
                        <Crop className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePendingFile(idx)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded"
                      title="Bỏ tệp này"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Chat Input Bar */}
            <form onSubmit={handleSendMessage} className="p-2.5 sm:p-3 bg-white border-t border-slate-200/90 flex items-center gap-2 shrink-0">
              {/* Hidden File Inputs */}
              <input
                type="file"
                ref={imageInputRef}
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => e.target.files && handleAddFiles(e.target.files)}
              />
              <input
                type="file"
                ref={fileInputRef}
                accept="*/*"
                multiple
                className="hidden"
                onChange={e => e.target.files && handleAddFiles(e.target.files)}
              />

              {/* Attachment Buttons */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="h-9 w-9 text-indigo-600 hover:bg-indigo-50 rounded-xl flex items-center justify-center transition-colors border border-indigo-100"
                  title="Gửi ảnh gốc không nén"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-9 w-9 text-slate-500 hover:bg-slate-100 rounded-xl flex items-center justify-center transition-colors border border-slate-200"
                  title="Đính kèm tệp tin tài liệu"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>

              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onPaste={handlePaste}
                placeholder={`Nhập tin nhắn gửi đến ${activeChat.name}... (Có thể dán Ctrl+V ảnh)`}
                className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-2xs"
              />
              <Button
                type="submit"
                size="xs"
                disabled={(!inputText.trim() && pendingFiles.length === 0) || uploadingFiles}
                className="bg-blue-600 hover:bg-blue-700 font-bold px-4 h-9 rounded-xl shadow-xs shrink-0 flex items-center gap-1"
              >
                {uploadingFiles ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Gửi
                  </>
                )}
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-3 p-6">
            <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shadow-2xs">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div className="text-center space-y-1 max-w-sm">
              <h4 className="text-xs font-bold text-slate-700">Nenkin Messenger Trung Tâm</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Chọn một cuộc trò chuyện từ danh sách bên trái để tiếp nhận, tư vấn và trao đổi tin nhắn trực tiếp.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT COL: DETAILS & MEMBERS PANEL (Collapsible) ── */}
      {activeChat && (
        <div className={`w-64 border-l border-slate-200/80 bg-white p-4 hidden xl:flex flex-col gap-4 shrink-0 overflow-y-auto ${!showRightPanel ? '!hidden' : ''}`}>
          <div className="text-center space-y-1.5 pb-4 border-b border-slate-100">
            <div className="relative mx-auto w-14 h-14">
              <div className={`w-14 h-14 rounded-full font-bold text-lg flex items-center justify-center border shadow-xs ${
                activeChat.type === 'GROUP' ? 'bg-violet-100 text-violet-700 border-violet-200' : getAvatarColor(activeChat.name)
              }`}>
                {activeChat.type === 'GROUP' ? <Users className="w-6 h-6" /> : activeChat.name?.[0]}
              </div>
              <span className={`w-3.5 h-3.5 rounded-full border-2 border-white absolute bottom-0 right-0 ${
                activeChat.isOnline ? 'bg-emerald-500 animate-pulse ring-1 ring-emerald-200' : 'bg-slate-300'
              }`} />
            </div>
            {(() => {
              const matchedStaff = availableStaffs.find(s => s.name === activeChat.name || (activeChat.code && s.code === activeChat.code));
              const roleTag = matchedStaff?.role || activeChat.role;
              return (
                <>
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <h3 className="font-bold text-xs text-slate-800">{activeChat.name}</h3>
                    {roleTag && (
                      <span className="px-1.5 py-0.2 rounded-md bg-blue-50 text-blue-700 text-[9px] font-bold border border-blue-200">
                        {roleTag}
                      </span>
                    )}
                  </div>
                  <p className={`text-[10px] flex items-center justify-center gap-1.5 ${
                    activeChat.isOnline ? 'text-emerald-600 font-semibold' : 'text-slate-400 font-normal'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      activeChat.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                    }`} />
                    <span>{activeChat.lastActiveText || (activeChat.isOnline ? 'Đang hoạt động' : 'Ngoại tuyến')}</span>
                  </p>
                  {(activeChat.code || matchedStaff?.code) && (
                    <span className="inline-block text-[9px] font-mono text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                      Mã: #{activeChat.code || matchedStaff?.code}
                    </span>
                  )}
                </>
              );
            })()}
          </div>

          {activeChat.type === 'GROUP' ? (
            <div className="space-y-2 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Thành viên nhóm ({activeChat.members?.length || 1})</span>
              <div className="space-y-1.5">
                {(activeChat.members || ['Tôi']).map((mName, idx) => {
                  const memberData = availableStaffs.find(s => s.name === mName) || availableCustomers.find(c => c.name === mName);
                  const isMemberOnline = memberData?.isOnline ?? false;
                  return (
                    <div key={idx} className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative shrink-0">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] border ${getAvatarColor(mName)}`}>
                            {mName[0] || 'U'}
                          </div>
                          <span className={`w-2 h-2 rounded-full border border-white absolute -bottom-0.5 -right-0.5 ${
                            isMemberOnline ? 'bg-emerald-500 animate-pulse ring-1 ring-emerald-200' : 'bg-slate-300'
                          }`} />
                        </div>
                        <span className="font-semibold text-slate-800 truncate">{mName}</span>
                      </div>
                      <span className={`text-[9px] shrink-0 font-medium ${isMemberOnline ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {isMemberOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Thông tin liên hệ</span>
              {(() => {
                const matchedStaff = availableStaffs.find(s => s.name === activeChat.name || (activeChat.code && s.code === activeChat.code));
                const isStaff = !!matchedStaff || activeChat.type === 'DIRECT' || activeChat.role === 'ADMIN' || activeChat.role === 'MANAGER' || (activeChat.code && activeChat.code.startsWith('NV'));
                const roleTitle = matchedStaff?.role || (activeChat.role === 'ADMIN' ? 'Quản trị viên' : activeChat.role === 'MANAGER' ? 'Quản lý' : activeChat.role === 'CTV' || activeChat.type === 'CTV' ? 'Cộng tác viên (CTV)' : isStaff ? 'Nhân viên nội bộ' : 'Khách hàng');
                const accountTypeLabel = isStaff ? 'Nhân sự nội bộ' : activeChat.type === 'CTV' ? 'Cộng tác viên (CTV)' : 'Khách hàng';

                return (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Phân loại:</span>
                      <span className={`font-bold ${isStaff ? 'text-blue-600' : activeChat.type === 'CTV' ? 'text-purple-600' : 'text-emerald-600'}`}>
                        {accountTypeLabel}
                      </span>
                    </div>
                    {isStaff && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Chức vụ:</span>
                        <span className="font-semibold text-slate-800">{roleTitle}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">{isStaff ? 'Mã nhân viên:' : 'Mã định danh:'}</span>
                      <span className="font-mono font-medium text-slate-700">
                        {activeChat.code ? `#${activeChat.code}` : matchedStaff?.code ? `#${matchedStaff.code}` : 'Chưa có'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">SĐT:</span>
                      <span className="font-semibold text-slate-800">{activeChat.phone || 'Chưa có'}</span>
                    </div>
                    {activeChat.email && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Email:</span>
                        <span className="text-slate-700 truncate max-w-[120px]" title={activeChat.email}>{activeChat.email}</span>
                      </div>
                    )}

                    {/* Dossier Quick Access */}
                    <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                      <button
                        type="button"
                        onClick={handleOpenDossierAndDockChat}
                        className="w-full h-8 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                        title="Mở hồ sơ & thu nhỏ khung chat nổi để vừa duyệt vừa trao đổi"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Mở hồ sơ & Thu nhỏ chat</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenDossierNewTab}
                        className="w-full h-7 px-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 border border-slate-200 transition-colors"
                        title="Mở hồ sơ ở tab mới"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                        <span>Mở hồ sơ ở tab mới</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ── ADVANCED CREATE GROUP MODAL ── */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-600" /> Tạo Nhóm Chat Mới
              </h3>
              <button type="button" onClick={() => setShowCreateGroupModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-3">
              {/* Group Title Input */}
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Tên Nhóm Chat</label>
                <Input
                  type="text"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  placeholder="Ví dụ: Nhóm Quyết Toán CTV Tokyo..."
                  className="text-xs font-semibold"
                />
              </div>

              {/* Categorized Member Picker */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Thêm Thành Viên Vào Nhóm</label>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    Đã chọn: {selectedUserIds.length + selectedCustomerIds.length} người
                  </span>
                </div>

                {/* Member Category Switcher Tabs */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-2">
                  <button
                    type="button"
                    onClick={() => setMemberCategoryTab('STAFF')}
                    className={`py-1 text-xs font-bold rounded-lg transition-all ${
                      memberCategoryTab === 'STAFF' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
                    }`}
                  >
                    🤝 CTV & Nhân viên ({availableStaffs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemberCategoryTab('CUSTOMER')}
                    className={`py-1 text-xs font-bold rounded-lg transition-all ${
                      memberCategoryTab === 'CUSTOMER' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
                    }`}
                  >
                    👤 Khách hàng ({availableCustomers.length})
                  </button>
                </div>

                {/* Member Search Bar */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="text"
                    value={memberSearchQuery}
                    onChange={e => setMemberSearchQuery(e.target.value)}
                    placeholder={`Tìm tên ${memberCategoryTab === 'STAFF' ? 'CTV / Nhân viên' : 'Khách hàng'}...`}
                    className="pl-7 text-xs bg-slate-50 border-slate-200 rounded-lg h-8"
                  />
                </div>

                {/* Checkable List */}
                <div className="space-y-1 max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50">
                  {filteredModalMembers.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 italic">Không tìm thấy thành viên phù hợp</div>
                  ) : (
                    filteredModalMembers.map(m => {
                      const isSelected = m.type === 'STAFF'
                        ? selectedUserIds.includes(m.id)
                        : selectedCustomerIds.includes(m.id);

                      return (
                        <label
                          key={m.id}
                          className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                            isSelected ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-100 hover:bg-slate-100/60'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              m.type === 'STAFF' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-700'
                            }`}>
                              {m.name?.[0] || 'U'}
                            </div>
                            <div>
                              <span className="font-bold text-slate-800 block text-xs">{m.name}</span>
                              <span className="text-[9px] text-slate-400 font-mono">
                                {m.role || `Mã #${m.code || '---'}`} {m.phone ? `• SĐT: ${m.phone}` : ''}
                              </span>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={e => {
                              if (m.type === 'STAFF') {
                                if (e.target.checked) setSelectedUserIds(prev => [...prev, m.id]);
                                else setSelectedUserIds(prev => prev.filter(id => id !== m.id));
                              } else {
                                if (e.target.checked) setSelectedCustomerIds(prev => [...prev, m.id]);
                                else setSelectedCustomerIds(prev => prev.filter(id => id !== m.id));
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" size="xs" onClick={() => setShowCreateGroupModal(false)}>Hủy</Button>
                <Button type="submit" size="xs" loading={creatingGroup} loadingText="Đang tạo nhóm..." className="bg-purple-600 hover:bg-purple-700 font-bold px-4">
                  Tạo Nhóm Chat
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: QUICK NEW 1-1 CHAT ── */}
      {showQuickNewChatModal && (
        <QuickNewChatModal
          availableStaffs={availableStaffs}
          availableCustomers={availableCustomers}
          onClose={() => setShowQuickNewChatModal(false)}
          onOpenConversation={handleOpenConversationById}
        />
      )}

      {/* ── MODAL: ADD MEMBERS TO EXISTING CHAT ── */}
      {showAddMembersModal && activeChat && (
        <AddMembersModal
          conversationId={activeChat.id}
          conversationTitle={activeChat.name}
          availableStaffs={availableStaffs}
          availableCustomers={availableCustomers}
          currentMemberNames={activeChat.members || []}
          onClose={() => setShowAddMembersModal(false)}
          onSuccess={() => {
            setShowAddMembersModal(false);
            loadConversations(true, false);
            if (activeChatId) loadRealMessages(activeChatId, false);
          }}
        />
      )}

      {/* ── MODAL: SAVE ATTACHMENT TO CUSTOMER DOSSIER ── */}
      {selectedAttachmentForDossier && (
        <AssignToDossierModal
          attachment={selectedAttachmentForDossier}
          defaultCustomer={activeChat?.customerId ? {
            id: activeChat.customerId,
            code: activeChat.code,
            name: activeChat.name,
          } : null}
          onClose={() => setSelectedAttachmentForDossier(null)}
          onSuccess={() => {
            toast.success('Đã lưu tài liệu vào hồ sơ khách hàng thành công!');
          }}
        />
      )}

      {/* ── MODAL: HIGH-RESOLUTION LIGHTBOX PREVIEW ── */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => {
            setLightboxUrl(null);
            setLightboxMetadata(null);
          }}
        >
          <div className="relative max-w-5xl max-h-[92vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
              {/* Badge for Original vs Edited */}
              {lightboxMetadata?.isViewingOriginal ? (
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/90 text-white text-[10px] font-bold tracking-wide uppercase shadow-xs flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" /> Ảnh gốc ban đầu
                </span>
              ) : lightboxMetadata?.originalUrl ? (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-600/90 text-white text-[10px] font-bold tracking-wide uppercase shadow-xs flex items-center gap-1">
                  <Crop className="w-3 h-3" /> Bản đã crop / xoay
                </span>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  const urlToEdit = lightboxUrl;
                  const nameToEdit = lightboxMetadata?.name || 'document.jpg';
                  const origUrl = lightboxMetadata?.originalUrl || lightboxUrl;
                  const origName = lightboxMetadata?.originalName || nameToEdit;
                  const msgId = lightboxMetadata?.messageId;
                  setLightboxUrl(null);
                  setLightboxMetadata(null);
                  setImageEditorTarget({
                    url: urlToEdit,
                    name: nameToEdit,
                    originalUrl: origUrl,
                    originalName: origName,
                    messageId: msgId,
                  });
                }}
                className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1 text-xs font-semibold shadow-xs"
                title="Chỉnh sửa (Cắt & Xoay ảnh)"
              >
                <Crop className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cắt / Xoay</span>
              </button>

              {/* Toggle view between Original and Edited photo */}
              {lightboxMetadata?.originalUrl && !lightboxMetadata.originalPurged && (
                lightboxMetadata.isViewingOriginal && lightboxMetadata.editedUrl ? (
                  <button
                    type="button"
                    onClick={() => {
                      setLightboxUrl(lightboxMetadata.editedUrl!);
                      setLightboxMetadata(prev => prev ? ({ ...prev, isViewingOriginal: false }) : null);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1 text-xs font-semibold shadow-xs"
                    title="Chuyển về xem ảnh đã xử lý (crop/xoay)"
                  >
                    <Crop className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Xem bản đã crop</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setLightboxUrl(lightboxMetadata.originalUrl!);
                      setLightboxMetadata(prev => prev ? ({ ...prev, isViewingOriginal: true }) : null);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center gap-1 text-xs font-semibold shadow-xs"
                    title="Xem ảnh gốc ban đầu chưa chỉnh sửa"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Xem ảnh gốc</span>
                  </button>
                )
              )}

              {/* Purge original image file button */}
              {lightboxMetadata?.originalUrl && !lightboxMetadata.originalPurged && lightboxMetadata?.messageId && (
                <button
                  type="button"
                  onClick={async () => {
                    const msgId = lightboxMetadata.messageId!;
                    const origUrl = lightboxMetadata.originalUrl!;
                    const origName = lightboxMetadata.originalName;
                    await handleDeleteOriginalImage(msgId, origUrl, origName);
                    if (lightboxMetadata.isViewingOriginal && lightboxMetadata.editedUrl) {
                      setLightboxUrl(lightboxMetadata.editedUrl);
                      setLightboxMetadata(prev => prev ? ({ ...prev, originalUrl: null, originalPurged: true, isViewingOriginal: false }) : null);
                    } else if (lightboxMetadata.isViewingOriginal) {
                      setLightboxUrl(null);
                      setLightboxMetadata(null);
                    } else {
                      setLightboxMetadata(prev => prev ? ({ ...prev, originalUrl: null, originalPurged: true }) : null);
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-700 text-white transition-colors flex items-center gap-1 text-xs font-semibold shadow-xs"
                  title="Xóa tệp ảnh gốc trên máy chủ để tiết kiệm dung lượng"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Xóa file gốc</span>
                </button>
              )}

              <a
                href={lightboxUrl}
                download={lightboxMetadata?.name || 'document.jpg'}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-white/20 hover:bg-white/40 text-white transition-colors"
                title="Tải ảnh này về máy"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => {
                  setLightboxUrl(null);
                  setLightboxMetadata(null);
                }}
                className="p-2 rounded-xl bg-white/20 hover:bg-white/40 text-white transition-colors"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxUrl}
              alt="Ảnh phóng to"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* ── MODAL: IMAGE EDITOR (ROTATE & CROP) ── */}
      {imageEditorTarget && (
        <ImageEditorModal
          isOpen={!!imageEditorTarget}
          onClose={() => setImageEditorTarget(null)}
          imageUrl={imageEditorTarget.url}
          imageName={imageEditorTarget.name}
          originalUrl={imageEditorTarget.originalUrl}
          originalName={imageEditorTarget.originalName}
          isPendingMode={!!imageEditorTarget.isPending}
          onApplyPending={handleApplyPendingImage}
          onSaveToDossier={handleSaveEditedImageToDossier}
          onSendToChat={handleSendEditedImageToChat}
        />
      )}

    </div>
  );
}
