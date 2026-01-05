/**
 * InquiryDrawerContext - Global context for opening the inquiry drawer from anywhere
 * 
 * Flow when starting a new conversation:
 * 1. User clicks "Message" on a quote
 * 2. FirstMessageModal opens for user to type their message
 * 3. After submitting, InquiryDrawer opens with the conversation
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { InquiryDrawer, FirstMessageModal, type InquiryDrawerContext as DrawerContext } from '@/components/inquiries'
import { createInquiry, listInquiries } from '@/api/inquiries'

interface InquiryDrawerContextValue {
  openDrawer: (context?: DrawerContext | null) => void
  closeDrawer: () => void
  isOpen: boolean
}

const InquiryDrawerContext = createContext<InquiryDrawerContextValue | null>(null)

export function useInquiryDrawer() {
  const context = useContext(InquiryDrawerContext)
  if (!context) {
    throw new Error('useInquiryDrawer must be used within InquiryDrawerProvider')
  }
  return context
}

interface InquiryDrawerProviderProps {
  children: ReactNode
}

export function InquiryDrawerProvider({ children }: InquiryDrawerProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [drawerContext, setDrawerContext] = useState<DrawerContext | null>(null)
  
  // First message modal state
  const [isFirstMessageModalOpen, setIsFirstMessageModalOpen] = useState(false)
  const [pendingContext, setPendingContext] = useState<DrawerContext | null>(null)
  const [isCreatingInquiry, setIsCreatingInquiry] = useState(false)

  const openDrawer = useCallback((context?: DrawerContext | null) => {
    if (context) {
      // New conversation - show first message modal
      setPendingContext(context)
      setIsFirstMessageModalOpen(true)
    } else {
      // Just opening inbox (no context) - open drawer directly
      setDrawerContext(null)
      setIsOpen(true)
    }
  }, [])

  const closeDrawer = useCallback(() => {
    setIsOpen(false)
    setDrawerContext(null)
  }, [])

  const handleFirstMessageSubmit = useCallback(async (message: string) => {
    if (!pendingContext) return
    
    setIsCreatingInquiry(true)
    try {
      // Check if inquiry already exists
      const existingList = await listInquiries({ status: ['pending', 'active'], limit: 50 })
      const existing = existingList.items.find(
        i => i.company_id === pendingContext.companyId && i.vehicle_id === pendingContext.vehicleId
      )
      
      if (existing) {
        // Inquiry exists - just open the drawer (user can send message there)
        setIsFirstMessageModalOpen(false)
        setDrawerContext(pendingContext)
        setIsOpen(true)
        setPendingContext(null)
        return
      }
      
      // Create new inquiry with user's message
      await createInquiry({
        company_id: pendingContext.companyId,
        vehicle_id: pendingContext.vehicleId,
        quote_id: pendingContext.quoteId,
        quoted_total_price: pendingContext.quotedTotalPrice,
        quoted_currency: 'USD',
        message: message,
      })
      
      // Close modal and open drawer
      setIsFirstMessageModalOpen(false)
      setDrawerContext(pendingContext)
      setIsOpen(true)
      setPendingContext(null)
    } catch (error: any) {
      console.error('[InquiryDrawerContext] Failed to create inquiry:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to start conversation'
      alert(errorMessage)
    } finally {
      setIsCreatingInquiry(false)
    }
  }, [pendingContext])

  const handleFirstMessageClose = useCallback(() => {
    setIsFirstMessageModalOpen(false)
    setPendingContext(null)
  }, [])

  return (
    <InquiryDrawerContext.Provider value={{ openDrawer, closeDrawer, isOpen }}>
      {children}
      
      {/* First Message Modal - shown before creating new inquiry */}
      <FirstMessageModal
        open={isFirstMessageModalOpen}
        onClose={handleFirstMessageClose}
        onSubmit={handleFirstMessageSubmit}
        companyName={pendingContext?.companyName}
        isLoading={isCreatingInquiry}
      />
      
      {/* Main Inquiry Drawer */}
      <InquiryDrawer
        open={isOpen}
        onClose={closeDrawer}
        initialContext={drawerContext}
      />
    </InquiryDrawerContext.Provider>
  )
}
