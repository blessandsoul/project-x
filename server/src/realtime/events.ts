/**
 * Socket.IO Event Emission Helpers
 *
 * Provides functions to emit real-time events to connected clients.
 * These should be called after successful database operations.
 *
 * Events emitted:
 * - inquiry:new - New inquiry created
 * - message:new - New message sent
 * - inquiry:updated - Inquiry status/price updated
 * - read:updated - Read state updated (optional)
 */

import { getIO } from './socket.js';

/**
 * Emit event when a new inquiry is created
 * Notifies both the user and the company
 */
export function emitInquiryNew(
  inquiryId: number,
  userId: number,
  companyId: number
): void {
  const io = getIO();
  if (!io) {
    console.log('[Socket.IO Events] emitInquiryNew: io is null, skipping');
    return;
  }

  const payload = { inquiryId };
  console.log('[Socket.IO Events] emitInquiryNew:', { inquiryId, userId, companyId });

  // Notify the user who created the inquiry
  io.to(`user:${userId}`).emit('inquiry:new', payload);

  // Notify the company
  io.to(`company:${companyId}`).emit('inquiry:new', payload);
}

/**
 * Emit event when a new message is sent
 * Notifies the inquiry room and both participants
 */
export function emitMessageNew(
  inquiryId: number,
  messageId: number,
  userId: number,
  companyId: number
): void {
  const io = getIO();
  if (!io) {
    console.log('[Socket.IO Events] emitMessageNew: io is null, skipping');
    return;
  }

  const payload = { inquiryId, messageId };
  console.log('[Socket.IO Events] emitMessageNew:', { inquiryId, messageId, userId, companyId });

  // Notify everyone in the inquiry room (for live chat updates)
  io.to(`inquiry:${inquiryId}`).emit('message:new', payload);

  // Also notify user and company rooms (for list/unread updates)
  // even if they don't have the inquiry open
  io.to(`user:${userId}`).emit('message:new', payload);
  io.to(`company:${companyId}`).emit('message:new', payload);
}

/**
 * Emit event when an inquiry is updated (status, price, etc.)
 * Notifies the inquiry room and both participants
 */
export function emitInquiryUpdated(
  inquiryId: number,
  userId: number,
  companyId: number
): void {
  const io = getIO();
  if (!io) return;

  const payload = { inquiryId };

  // Notify everyone in the inquiry room
  io.to(`inquiry:${inquiryId}`).emit('inquiry:updated', payload);

  // Also notify user and company rooms
  io.to(`user:${userId}`).emit('inquiry:updated', payload);
  io.to(`company:${companyId}`).emit('inquiry:updated', payload);
}

/**
 * Emit event when read state is updated
 * Notifies the inquiry room so other participants see read receipts
 */
export function emitReadUpdated(
  inquiryId: number,
  userId: number,
  role: 'user' | 'company',
  lastReadMessageId: number
): void {
  const io = getIO();
  if (!io) return;

  const payload = { inquiryId, userId, role, lastReadMessageId };
  console.log('[Socket.IO Events] emitReadUpdated:', payload);

  // Notify everyone in the inquiry room
  io.to(`inquiry:${inquiryId}`).emit('read:updated', payload);
}
