/**
 * InquiryThread — Right column of the inquiry drawer
 * 
 * Displays chat messages for a selected inquiry with composer.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { type Inquiry, type InquiryMessage, type OptimisticMessage, getInquiryCounterparty } from '@/api/inquiries'
import { Send, Check, X, Loader2, ArrowDown, Clock, RotateCcw, CheckCheck } from 'lucide-react'

// Union type for messages that can be either server or optimistic
type DisplayMessage = InquiryMessage | OptimisticMessage

function isOptimisticMessage(msg: DisplayMessage): msg is OptimisticMessage {
  return '_localStatus' in msg
}

interface InquiryThreadProps {
  inquiry: Inquiry | null
  messages: DisplayMessage[]
  currentUserId: number | null
  currentUserRole?: 'user' | 'company' | null
  otherLastReadMessageId?: number | null
  isLoading?: boolean
  isCreating?: boolean
  onSendMessage: (message: string, clientMessageId: string) => void
  onRetryMessage?: (clientMessageId: string, message: string) => void
  onDeleteFailedMessage?: (clientMessageId: string) => void
  onAccept?: () => void
  onCancel?: () => void
  isUpdating?: boolean
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  if (isToday) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

function getStatusBadge(status: string) {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
    active: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Active' },
    accepted: { bg: 'bg-green-100', text: 'text-green-700', label: 'Accepted' },
    declined: { bg: 'bg-red-100', text: 'text-red-700', label: 'Declined' },
    cancelled: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Cancelled' },
    expired: { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Expired' },
  }

  const style = styles[status] || styles.pending
  return (
    <Badge variant="secondary" className={cn('text-xs', style.bg, style.text)}>
      {style.label}
    </Badge>
  )
}

export function InquiryThread({
  inquiry,
  messages,
  currentUserId,
  currentUserRole,
  otherLastReadMessageId,
  isLoading,
  isCreating,
  onSendMessage,
  onRetryMessage,
  onDeleteFailedMessage,
  onAccept,
  onCancel,
  isUpdating,
}: InquiryThreadProps) {
  const [messageText, setMessageText] = useState('')
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showNewMessages, setShowNewMessages] = useState(false)
  const isNearBottomRef = useRef(true)
  const prevMessagesLengthRef = useRef(messages.length)
  const isInitialLoadRef = useRef(true)

  // Get the actual scrollable viewport element from ScrollArea
  const getScrollViewport = useCallback(() => {
    if (!scrollAreaRef.current) return null
    // ScrollArea renders a viewport div with data-radix-scroll-area-viewport
    return scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null
  }, [])

  // Check if user is near bottom of scroll
  const checkIfNearBottom = useCallback(() => {
    const viewport = getScrollViewport()
    if (!viewport) return true
    const { scrollTop, scrollHeight, clientHeight } = viewport
    return scrollHeight - scrollTop - clientHeight < 100
  }, [getScrollViewport])

  // Handle scroll events
  const handleScroll = useCallback(() => {
    isNearBottomRef.current = checkIfNearBottom()
    if (isNearBottomRef.current) {
      setShowNewMessages(false)
    }
  }, [checkIfNearBottom])

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    const viewport = getScrollViewport()
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight
      setShowNewMessages(false)
    }
  }, [getScrollViewport])

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!isLoading && messages.length > 0 && isInitialLoadRef.current) {
      isInitialLoadRef.current = false
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        scrollToBottom()
      })
    }
  }, [isLoading, messages.length, scrollToBottom])

  // Reset initial load flag when inquiry changes
  useEffect(() => {
    isInitialLoadRef.current = true
  }, [inquiry?.id])

  // Smart auto-scroll when messages change
  useEffect(() => {
    const hasNewMessages = messages.length > prevMessagesLengthRef.current
    prevMessagesLengthRef.current = messages.length

    if (hasNewMessages && !isInitialLoadRef.current) {
      if (isNearBottomRef.current) {
        // User is near bottom, auto-scroll
        requestAnimationFrame(() => {
          scrollToBottom()
        })
      } else {
        // User scrolled up, show "new messages" button
        setShowNewMessages(true)
      }
    }
  }, [messages, scrollToBottom])

  const handleSend = () => {
    const text = messageText.trim()
    if (!text) return

    // Generate client_message_id for optimistic UI
    const clientMessageId = crypto.randomUUID()
    onSendMessage(text, clientMessageId)
    setMessageText('')
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Loading state when creating/finding inquiry from vehicle page
  if (isCreating) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <Loader2 className="size-8 animate-spin text-primary mb-3" />
        <p className="text-sm font-medium">Opening conversation...</p>
        <p className="text-xs mt-1">Please wait</p>
      </div>
    )
  }

  // Empty state
  if (!inquiry) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <Send className="size-6 opacity-50" />
        </div>
        <p className="text-sm font-medium">Select a conversation</p>
        <p className="text-xs mt-1">Choose from your inquiries on the left</p>
      </div>
    )
  }

  const isTerminal = ['accepted', 'declined', 'cancelled', 'expired'].includes(inquiry.status)
  const canAccept = inquiry.status === 'active' && inquiry.final_price != null
  const canCancel = ['pending', 'active'].includes(inquiry.status)
  const counterparty = getInquiryCounterparty(inquiry, currentUserRole ?? null)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {counterparty.avatarText}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm text-slate-900">
                {counterparty.title}
              </h3>
              <p className="text-xs text-slate-500">
                {counterparty.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {getStatusBadge(inquiry.status)}

            {/* Action buttons */}
            {!isTerminal && (
              <div className="flex items-center gap-1.5 ml-2">
                {canAccept && onAccept && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={onAccept}
                    disabled={isUpdating}
                    className="h-7 text-xs gap-1"
                  >
                    {isUpdating ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                    Accept
                  </Button>
                )}
                {canCancel && onCancel && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isUpdating}
                    className="h-7 text-xs gap-1"
                  >
                    {isUpdating ? <Loader2 className="size-3 animate-spin" /> : <X className="size-3" />}
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Final price indicator */}
        {inquiry.final_price != null && (
          <div className="mt-2 px-3 py-2 bg-green-50 rounded-lg border border-green-100">
            <p className="text-xs text-green-700">
              <span className="font-medium">Final Price:</span>{' '}
              ${inquiry.final_price.toLocaleString()} {inquiry.final_currency || 'USD'}
            </p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 relative overflow-hidden">
        <ScrollArea className="h-full px-4" ref={scrollAreaRef} onScrollCapture={handleScroll}>
          {isLoading ? (
            <div className="py-8 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    'max-w-[70%] rounded-2xl p-3 animate-pulse',
                    i % 2 === 0 ? 'bg-primary/10' : 'bg-slate-100'
                  )}>
                    <div className="h-4 w-32 bg-slate-200 rounded" />
                    <div className="h-3 w-20 bg-slate-200 rounded mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Start the conversation below</p>
            </div>
          ) : (
            <div className="py-4 space-y-3">
              {/* Status banner for pending */}
              {inquiry.status === 'pending' && (
                <div className="text-center py-2 px-4 bg-yellow-50 rounded-lg border border-yellow-100">
                  <p className="text-xs text-yellow-700">Waiting for company response…</p>
                </div>
              )}

              {messages.map((msg, index) => {
                const isOwn = msg.sender_id === currentUserId
                const isSystem = msg.message_type === 'system'
                const showSender = !isOwn && !isSystem && (
                  index === 0 || messages[index - 1]?.sender_id !== msg.sender_id
                )

                // Check if this is an optimistic message
                const isOptimistic = isOptimisticMessage(msg)
                const localStatus = isOptimistic ? msg._localStatus : 'sent'
                const messageKey = isOptimistic ? msg._localId : String(msg.id)

                // System messages - centered, muted
                if (isSystem) {
                  return (
                    <div key={messageKey} className="flex justify-center py-2">
                      <p className="text-xs text-slate-400 italic">
                        {msg.message}
                      </p>
                    </div>
                  )
                }

                return (
                  <div
                    key={messageKey}
                    className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
                  >
                    {/* Company avatar for their messages */}
                    {!isOwn && showSender && (
                      <Avatar className="size-7 mr-2 mt-1 shrink-0">
                        <AvatarFallback className="bg-slate-200 text-slate-600 text-xs">
                          {inquiry.company?.name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    {!isOwn && !showSender && <div className="w-9 shrink-0" />}

                    <div className={cn('max-w-[70%]', !isOwn && showSender && 'mt-1')}>
                      {showSender && msg.sender && (
                        <p className="text-xs text-slate-500 mb-1 ml-1">
                          {msg.sender.username}
                        </p>
                      )}
                      <div
                        className={cn(
                          'rounded-2xl px-4 py-2.5 relative',
                          isOwn
                            ? 'bg-primary text-white rounded-br-md'
                            : 'bg-slate-100 text-slate-900 rounded-bl-md border border-slate-200',
                          localStatus === 'failed' && 'bg-red-100 border-red-200'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {msg.message}
                        </p>
                      </div>

                      {/* Status indicator row */}
                      <div className={cn(
                        'flex items-center gap-1.5 mt-1',
                        isOwn ? 'justify-end mr-1' : 'ml-1'
                      )}>
                        {/* Timestamp */}
                        <span className="text-[10px] text-slate-400">
                          {formatMessageTime(msg.created_at)}
                        </span>

                        {/* Status icons for own messages */}
                        {isOwn && localStatus === 'sending' && (
                          <Clock className="size-3 text-slate-400 animate-pulse" />
                        )}
                        {isOwn && localStatus === 'sent' && !isOptimistic && otherLastReadMessageId && msg.id <= otherLastReadMessageId && (
                          <CheckCheck className="size-3 text-green-500" />
                        )}
                        {isOwn && localStatus === 'sent' && (isOptimistic || !otherLastReadMessageId || msg.id > otherLastReadMessageId) && (
                          <CheckCheck className="size-3 text-slate-400" />
                        )}
                        {isOwn && localStatus === 'failed' && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-red-500 font-medium">Failed</span>
                            {onRetryMessage && isOptimistic && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 px-1.5 text-[10px] text-red-600 hover:text-red-700"
                                onClick={() => onRetryMessage(msg._localId, msg.message)}
                              >
                                <RotateCcw className="size-3 mr-0.5" />
                                Retry
                              </Button>
                            )}
                            {onDeleteFailedMessage && isOptimistic && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 px-1 text-[10px] text-slate-400 hover:text-slate-600"
                                onClick={() => onDeleteFailedMessage(msg._localId)}
                              >
                                <X className="size-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* New messages button */}
        {showNewMessages && (
          <Button
            size="sm"
            variant="secondary"
            onClick={scrollToBottom}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 shadow-lg gap-1 text-xs"
          >
            <ArrowDown className="size-3" />
            New messages
          </Button>
        )}
      </div>

      <Separator />

      {/* Composer */}
      <div className="p-3 bg-white">
        {/* Status-specific banners */}
        {inquiry.status === 'accepted' && (
          <div className="text-center py-2 px-4 mb-2 bg-green-50 rounded-lg border border-green-100">
            <p className="text-xs text-green-700 font-medium">✓ Inquiry accepted</p>
          </div>
        )}
        {inquiry.status === 'cancelled' && (
          <div className="text-center py-2 px-4 mb-2 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500">Conversation cancelled</p>
          </div>
        )}
        {inquiry.status === 'declined' && (
          <div className="text-center py-2 px-4 mb-2 bg-red-50 rounded-lg border border-red-100">
            <p className="text-xs text-red-600">Inquiry declined by company</p>
          </div>
        )}
        {inquiry.status === 'expired' && (
          <div className="text-center py-2 px-4 mb-2 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500">Inquiry expired</p>
          </div>
        )}

        {isTerminal ? (
          <div className="text-center py-2 text-sm text-slate-400">
            This conversation is closed.
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="min-h-[44px] max-h-32 resize-none"
              rows={1}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!messageText.trim()}
              className="size-11 shrink-0"
            >
              <Send className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
