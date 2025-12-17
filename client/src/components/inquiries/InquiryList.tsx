/**
 * InquiryList — Left column of the inquiry drawer
 * 
 * Displays list of user's inquiries with search, unread badges, and selection.
 */

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { type Inquiry, getInquiryCounterparty } from '@/api/inquiries'
import { Search, MessageSquare } from 'lucide-react'

interface InquiryListProps {
  inquiries: Inquiry[]
  selectedId: number | null
  onSelect: (inquiry: Inquiry) => void
  isLoading?: boolean
  currentUserRole?: 'user' | 'company' | null
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-700'
    case 'active': return 'bg-blue-100 text-blue-700'
    case 'accepted': return 'bg-green-100 text-green-700'
    case 'declined': return 'bg-red-100 text-red-700'
    case 'cancelled': return 'bg-slate-100 text-slate-600'
    case 'expired': return 'bg-slate-100 text-slate-500'
    default: return 'bg-slate-100 text-slate-600'
  }
}

export function InquiryList({ inquiries, selectedId, onSelect, isLoading, currentUserRole }: InquiryListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  
  const filteredInquiries = useMemo(() => {
    if (!searchQuery.trim()) return inquiries
    
    const query = searchQuery.toLowerCase()
    return inquiries.filter(inquiry => {
      const counterparty = getInquiryCounterparty(inquiry, currentUserRole ?? null)
      const vehicleInfo = inquiry.vehicle 
        ? `${inquiry.vehicle.make} ${inquiry.vehicle.model} ${inquiry.vehicle.year}`.toLowerCase()
        : ''
      const subject = inquiry.subject?.toLowerCase() || ''
      
      return counterparty.title.toLowerCase().includes(query) || vehicleInfo.includes(query) || subject.includes(query)
    })
  }, [inquiries, searchQuery, currentUserRole])
  
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-slate-100">
          <div className="h-9 bg-slate-100 rounded-lg animate-pulse" />
        </div>
        <div className="flex-1 p-3 space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
              <div className="size-10 rounded-full bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-slate-100 rounded" />
                <div className="h-3 w-32 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-slate-50 border-slate-200"
          />
        </div>
      </div>
      
      {/* List */}
      <ScrollArea className="flex-1">
        {filteredInquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <MessageSquare className="size-8 mb-2 opacity-50" />
            <p className="text-sm">No conversations yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredInquiries.map((inquiry) => {
              const isSelected = selectedId === inquiry.id
              const hasUnread = (inquiry.unread_count ?? 0) > 0
              const counterparty = getInquiryCounterparty(inquiry, currentUserRole ?? null)
              
              return (
                <button
                  key={inquiry.id}
                  type="button"
                  onClick={() => onSelect(inquiry)}
                  className={cn(
                    'w-full p-3 flex items-start gap-3 text-left transition-colors',
                    'hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50',
                    isSelected && 'bg-primary/5 hover:bg-primary/5'
                  )}
                >
                  {/* Counterparty Avatar */}
                  <Avatar className="size-10 shrink-0">
                    <AvatarFallback className={cn(
                      'text-sm font-medium',
                      isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
                    )}>
                      {counterparty.avatarText}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn(
                        'font-medium text-sm truncate',
                        hasUnread ? 'text-slate-900' : 'text-slate-700'
                      )}>
                        {counterparty.title}
                      </span>
                      <span className="text-xs text-slate-400 shrink-0">
                        {formatRelativeTime(inquiry.last_message_at)}
                      </span>
                    </div>
                    
                    {/* Vehicle info */}
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {counterparty.subtitle}
                    </p>
                    
                    {/* Last message preview */}
                    {inquiry.last_message_text && (
                      <p className={cn(
                        'text-xs truncate mt-1',
                        hasUnread ? 'text-slate-600 font-medium' : 'text-slate-400'
                      )}>
                        {inquiry.last_message_text}
                      </p>
                    )}
                    
                    {/* Status + Unread */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge 
                        variant="secondary" 
                        className={cn('text-[10px] px-1.5 py-0', getStatusColor(inquiry.status))}
                      >
                        {inquiry.status}
                      </Badge>
                      {hasUnread && (
                        <Badge className="bg-primary text-white text-[10px] px-1.5 py-0 min-w-[18px] justify-center">
                          {inquiry.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
