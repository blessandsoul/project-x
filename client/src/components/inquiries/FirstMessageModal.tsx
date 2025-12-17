/**
 * FirstMessageModal — Modal for composing the first message when starting a new inquiry
 * 
 * Opens before creating an inquiry, allowing user to type a custom first message
 * instead of using a default automated message.
 */

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MessageSquare, Send, X } from 'lucide-react'

interface FirstMessageModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (message: string) => void
  companyName?: string
  isLoading?: boolean
}

export function FirstMessageModal({
  open,
  onClose,
  onSubmit,
  companyName,
  isLoading = false,
}: FirstMessageModalProps) {
  const [message, setMessage] = useState('')

  const handleSubmit = () => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage) return
    onSubmit(trimmedMessage)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleClose = () => {
    setMessage('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="size-5 text-primary" />
            Start Conversation
            {companyName && (
              <span className="text-muted-foreground font-normal">
                with {companyName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="first-message">Your Message</Label>
            <Textarea
              id="first-message"
              placeholder="Hi, I'm interested in shipping this vehicle..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={5}
              className="resize-none"
              autoFocus
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Press Ctrl+Enter to send
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            <X className="size-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!message.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <span className="size-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Sending...
              </>
            ) : (
              <>
                <Send className="size-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
