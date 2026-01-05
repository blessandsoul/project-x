/**
 * InquiryDrawer — Main drawer component for inquiry/messaging system
 * 
 * Two-column layout:
 * - Left: Inquiry list (inbox)
 * - Right: Chat thread
 * 
 * Opens from vehicle page when user clicks "Message" on a company quote.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { InquiryList } from './InquiryList'
import { InquiryThread } from './InquiryThread'
import { useAuth } from '@/hooks/useAuth'
import {
  listInquiries,
  getInquiryMessages,
  sendInquiryMessage,
  markInquiryRead,
  patchInquiry,
  type Inquiry,
  type InquiryMessage,
  type OptimisticMessage,
} from '@/api/inquiries'

// Union type for display messages
type DisplayMessage = InquiryMessage | OptimisticMessage

// Type guard for optimistic messages (used in InquiryThread)
export function isOptimisticMessage(msg: DisplayMessage): msg is OptimisticMessage {
  return '_localStatus' in msg
}
import {
  connectSocket,
  disconnectSocket,
  isSocketConnected,
  onConnectionChange,
  onInquiryNew,
  onMessageNew,
  onInquiryUpdated,
  onReadUpdated,
  joinInquiry,
  leaveInquiry,
} from '@/realtime/socket'

export interface InquiryDrawerContext {
  vehicleId: number
  companyId: number
  quoteId?: number
  quotedTotalPrice?: number
  companyName?: string
}

interface InquiryDrawerProps {
  open: boolean
  onClose: () => void
  initialContext?: InquiryDrawerContext | null
}


export function InquiryDrawer({ open, onClose, initialContext }: InquiryDrawerProps) {
  const { user, userRole } = useAuth()
  
  // State
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [messages, setMessages] = useState<InquiryMessage[]>([])
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([])
  const [otherLastReadMessageId, setOtherLastReadMessageId] = useState<number | null>(null)
  
  // Loading states
  const [isLoadingList, setIsLoadingList] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  
  // Pending sends map for parallel requests
  const pendingSendsRef = useRef<Map<string, Promise<InquiryMessage>>>(new Map())
  
  // Socket state
  const [socketConnected, setSocketConnected] = useState(false)
  const currentInquiryIdRef = useRef<number | null>(null)
  const myRoleRef = useRef<'user' | 'company' | null>(null)
  
  // Refs
  const initialContextProcessedRef = useRef(false)
  
  // Load inquiry list
  const loadInquiries = useCallback(async (silent = false) => {
    if (!user) return
    
    if (!silent) setIsLoadingList(true)
    try {
      const result = await listInquiries({ limit: 50 })
      setInquiries(result.items)
      
      // Update selectedInquiry if it exists in the new list (to sync status changes)
      setSelectedInquiry(prev => {
        if (!prev) return prev
        const updated = result.items.find(i => i.id === prev.id)
        return updated ?? prev
      })
    } catch (error) {
      console.error('Failed to load inquiries:', error)
    } finally {
      if (!silent) setIsLoadingList(false)
    }
  }, [user])
  
  // Load messages for selected inquiry
  const loadMessages = useCallback(async (inquiryId: number, silent = false) => {
    if (!silent) setIsLoadingMessages(true)
    try {
      const result = await getInquiryMessages(inquiryId, { limit: 50 })
      
      // Merge with optimistic messages - remove optimistic ones that now have server versions
      setMessages(result.messages)
      setOptimisticMessages(prev => {
        const serverClientIds = new Set(
          result.messages
            .filter(m => m.client_message_id)
            .map(m => m.client_message_id)
        )
        // Keep only optimistic messages that don't have a server version yet
        return prev.filter(om => !serverClientIds.has(om.client_message_id))
      })
      
      // Update read watermarks for "seen" status
      if (result.participants) {
        myRoleRef.current = result.participants.me?.role ?? null
        setOtherLastReadMessageId(result.participants.other?.last_read_message_id ?? null)
      }
      
      // Mark as read
      await markInquiryRead(inquiryId).catch(() => {})
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      if (!silent) setIsLoadingMessages(false)
    }
  }, [])
  
  // Handle initial context - find and select the inquiry for this company/vehicle
  // Note: Inquiry creation is now handled by InquiryDrawerContext before opening the drawer
  const handleInitialContext = useCallback(async (context: InquiryDrawerContext) => {
    if (!user) {
      console.warn('[InquiryDrawer] Cannot process context: user not logged in')
      return
    }
    
    console.log('[InquiryDrawer] Processing initial context - finding inquiry:', context)
    setIsCreating(true)
    try {
      // Find the inquiry for this company/vehicle (should already exist, created by context provider)
      const result = await listInquiries({ limit: 50 })
      const inquiry = result.items.find(
        i => i.company_id === context.companyId && i.vehicle_id === context.vehicleId
      )
      
      if (inquiry) {
        console.log('[InquiryDrawer] Found inquiry:', inquiry.id)
        setSelectedInquiry(inquiry)
        await loadMessages(inquiry.id)
      } else {
        console.warn('[InquiryDrawer] No inquiry found for context, user can create one manually')
      }
    } catch (error) {
      console.error('[InquiryDrawer] Failed to find inquiry:', error)
    } finally {
      setIsCreating(false)
    }
  }, [user, loadMessages])
  
  // Send message with optimistic UI
  const handleSendMessage = useCallback(async (message: string, clientMessageId: string) => {
    if (!selectedInquiry || !user) return
    
    // Create optimistic message
    const optimisticMsg: OptimisticMessage = {
      id: -Date.now(), // Temporary negative ID
      inquiry_id: selectedInquiry.id,
      sender_id: user.id,
      client_message_id: clientMessageId,
      message_type: 'text',
      message,
      attachments: null,
      created_at: new Date().toISOString(),
      sender: {
        id: user.id,
        username: user.username,
        role: 'user',
      },
      _localId: clientMessageId,
      _localStatus: 'sending',
      _localCreatedAt: Date.now(),
    }
    
    // Add optimistic message immediately
    setOptimisticMessages(prev => [...prev, optimisticMsg])
    
    // Send request in parallel (don't block)
    const sendPromise = sendInquiryMessage(selectedInquiry.id, { 
      message, 
      client_message_id: clientMessageId 
    })
    pendingSendsRef.current.set(clientMessageId, sendPromise)
    
    try {
      const serverMessage = await sendPromise
      
      // Success: remove optimistic, add server message
      setOptimisticMessages(prev => prev.filter(m => m._localId !== clientMessageId))
      setMessages(prev => {
        // Check if message already exists (from socket)
        const exists = prev.some(m => 
          m.id === serverMessage.id || m.client_message_id === clientMessageId
        )
        if (exists) return prev
        return [...prev, serverMessage]
      })
      
      // Refresh list to update last_message_at
      loadInquiries(true)
    } catch (error) {
      console.error('Failed to send message:', error)
      // Mark as failed
      setOptimisticMessages(prev => 
        prev.map(m => m._localId === clientMessageId 
          ? { ...m, _localStatus: 'failed' as const } 
          : m
        )
      )
    } finally {
      pendingSendsRef.current.delete(clientMessageId)
    }
  }, [selectedInquiry, user, loadInquiries])
  
  // Retry failed message
  const handleRetryMessage = useCallback((clientMessageId: string, message: string) => {
    // Remove failed message and resend
    setOptimisticMessages(prev => prev.filter(m => m._localId !== clientMessageId))
    handleSendMessage(message, clientMessageId)
  }, [handleSendMessage])
  
  // Delete failed message
  const handleDeleteFailedMessage = useCallback((clientMessageId: string) => {
    setOptimisticMessages(prev => prev.filter(m => m._localId !== clientMessageId))
  }, [])
  
  // Accept inquiry
  const handleAccept = useCallback(async () => {
    if (!selectedInquiry || isUpdating) return
    
    setIsUpdating(true)
    try {
      const updated = await patchInquiry(selectedInquiry.id, { status: 'accepted' })
      setSelectedInquiry(updated)
      loadInquiries(true)
    } catch (error) {
      console.error('Failed to accept inquiry:', error)
    } finally {
      setIsUpdating(false)
    }
  }, [selectedInquiry, isUpdating, loadInquiries])
  
  // Cancel inquiry
  const handleCancel = useCallback(async () => {
    if (!selectedInquiry || isUpdating) return
    
    setIsUpdating(true)
    try {
      const updated = await patchInquiry(selectedInquiry.id, { status: 'cancelled' })
      setSelectedInquiry(updated)
      loadInquiries(true)
    } catch (error) {
      console.error('Failed to cancel inquiry:', error)
    } finally {
      setIsUpdating(false)
    }
  }, [selectedInquiry, isUpdating, loadInquiries])
  
  // Select inquiry
  const handleSelectInquiry = useCallback((inquiry: Inquiry) => {
    setSelectedInquiry(inquiry)
    loadMessages(inquiry.id)
  }, [loadMessages])
  
  // Initial load when drawer opens
  useEffect(() => {
    if (open && user) {
      loadInquiries()
      initialContextProcessedRef.current = false
    }
    
    if (!open) {
      // Reset state when drawer closes
      setSelectedInquiry(null)
      setMessages([])
      initialContextProcessedRef.current = false
    }
  }, [open, user, loadInquiries])
  
  // Handle initial context after list loads
  useEffect(() => {
    if (
      open && 
      initialContext && 
      !initialContextProcessedRef.current && 
      !isLoadingList &&
      user
    ) {
      initialContextProcessedRef.current = true
      handleInitialContext(initialContext)
    }
  }, [open, initialContext, isLoadingList, user, handleInitialContext])
  
  // DISABLED: Polling fallback - Socket.IO should be the only real-time mechanism
  // If socket fails, we don't poll - user can manually refresh or we rely on
  // initial load + socket reconnection attempts
  // 
  // The polling was causing excessive server load (requests every 4-8 seconds)
  // even when socket connection was failing due to auth issues.
  //
  // TODO: Fix Socket.IO authentication if real-time updates aren't working
  // Check browser console for [Socket.IO] Connection error messages
  
  // Log socket connection status for debugging
  useEffect(() => {
    console.log('[InquiryDrawer] Socket connected status:', socketConnected)
    if (!socketConnected && open) {
      console.warn('[InquiryDrawer] Socket not connected - real-time updates disabled. Check browser console for Socket.IO errors.')
    }
  }, [socketConnected, open])
  
  // Socket.IO connection and event handling
  useEffect(() => {
    if (!open || !user) {
      console.log('[InquiryDrawer] Socket cleanup - open:', open, 'user:', !!user)
      disconnectSocket()
      return
    }
    
    console.log('[InquiryDrawer] Setting up socket connection...')
    // Connect socket
    connectSocket()
    // Check initial state (will be false, updated via onConnectionChange)
    setSocketConnected(isSocketConnected())
    
    // Listen for connection state changes
    const unsubConnection = onConnectionChange((connected) => {
      setSocketConnected(connected)
      if (connected) {
        // Refresh data on reconnect
        loadInquiries(true)
        if (currentInquiryIdRef.current) {
          loadMessages(currentInquiryIdRef.current, true)
          joinInquiry(currentInquiryIdRef.current)
        }
      }
    })
    
    // Listen for new inquiries
    const unsubInquiryNew = onInquiryNew(() => {
      loadInquiries(true)
    })
    
    // Listen for new messages
    const unsubMessageNew = onMessageNew((data) => {
      // Refresh list for unread count
      loadInquiries(true)
      // If this is the currently open inquiry, refresh messages
      if (currentInquiryIdRef.current === data.inquiryId) {
        loadMessages(data.inquiryId, true)
      }
    })
    
    // Listen for inquiry updates
    const unsubInquiryUpdated = onInquiryUpdated((data) => {
      loadInquiries(true)
      if (currentInquiryIdRef.current === data.inquiryId) {
        loadMessages(data.inquiryId, true)
      }
    })
    
    // Listen for read updates (for "seen" status)
    const unsubReadUpdated = onReadUpdated((data) => {
      // Only update if this is for the current inquiry and from the other side
      if (currentInquiryIdRef.current === data.inquiryId && data.role !== myRoleRef.current) {
        setOtherLastReadMessageId(data.lastReadMessageId)
      }
    })
    
    return () => {
      unsubConnection()
      unsubInquiryNew()
      unsubMessageNew()
      unsubInquiryUpdated()
      unsubReadUpdated()
      if (currentInquiryIdRef.current) {
        leaveInquiry(currentInquiryIdRef.current)
      }
    }
  }, [open, user, loadInquiries, loadMessages])
  
  // Join/leave inquiry rooms when selection changes
  useEffect(() => {
    const prevId = currentInquiryIdRef.current
    const newId = selectedInquiry?.id ?? null
    
    if (prevId !== newId) {
      if (prevId && socketConnected) {
        leaveInquiry(prevId)
      }
      if (newId && socketConnected) {
        joinInquiry(newId)
      }
      currentInquiryIdRef.current = newId
    }
  }, [selectedInquiry, socketConnected])
  
  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-[900px] p-0 flex flex-col"
      >
        <SheetHeader className="px-4 py-3 border-b border-slate-100 shrink-0">
          <SheetTitle className="text-base">Messages</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 flex min-h-0">
          {/* Left column - Inbox */}
          <div className="w-[320px] border-r border-slate-100 flex flex-col shrink-0">
            <InquiryList
              inquiries={inquiries}
              selectedId={selectedInquiry?.id ?? null}
              onSelect={handleSelectInquiry}
              isLoading={isLoadingList || isCreating}
              currentUserRole={userRole === 'company' ? 'company' : 'user'}
            />
          </div>
          
          {/* Right column - Chat */}
          <div className="flex-1 flex flex-col min-w-0">
            <InquiryThread
              inquiry={selectedInquiry}
              messages={[...messages, ...optimisticMessages.filter(om => om.inquiry_id === selectedInquiry?.id)]}
              currentUserId={user?.id ?? null}
              currentUserRole={userRole === 'company' ? 'company' : 'user'}
              otherLastReadMessageId={otherLastReadMessageId}
              isLoading={isLoadingMessages}
              onSendMessage={handleSendMessage}
              onRetryMessage={handleRetryMessage}
              onDeleteFailedMessage={handleDeleteFailedMessage}
              onAccept={handleAccept}
              onCancel={handleCancel}
              isUpdating={isUpdating}
              isCreating={isCreating}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
