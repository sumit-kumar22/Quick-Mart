import { repo } from '../data-access/repo.js';
import { COLLECTIONS } from '../config/constants.js';
import { AppError, asyncHandler, ok } from '../utils/response.js';
import { id } from '../utils/ids.js';

export const createTicket = asyncHandler(async (req, res) => {
  const { subject, message, orderId, category = 'general', priority = 'medium' } = req.body;
  if (!subject || !message) throw new AppError('subject and message are required', { code: 'VALIDATION_ERROR' });
  const ticket = await repo.insertOne(COLLECTIONS.SUPPORT_TICKETS, {
    _id: id('tkt'),
    userId: req.user._id,
    subject,
    message,
    orderId: orderId || null,
    category,
    priority,
    status: 'open',
    replies: [],
    attachments: [],
  });
  return ok(res, ticket, { message: 'Support ticket created', status: 201 });
});

export const getMyTickets = asyncHandler(async (req, res) => {
  const tickets = await repo.findMany(COLLECTIONS.SUPPORT_TICKETS, { userId: req.user._id }, { sort: { createdAt: -1 } });
  return ok(res, tickets, { message: 'Tickets fetched' });
});

export const getAllTickets = asyncHandler(async (req, res) => {
  const tickets = await repo.findMany(COLLECTIONS.SUPPORT_TICKETS, {}, { sort: { createdAt: -1 } });
  return ok(res, tickets, { message: 'Tickets fetched' });
});

export const replyTicket = asyncHandler(async (req, res) => {
  const ticket = await repo.findById(COLLECTIONS.SUPPORT_TICKETS, req.params.id);
  if (!ticket) throw new AppError('Ticket not found', { status: 404, code: 'NOT_FOUND' });
  const { message, from = 'admin' } = req.body;
  if (!message) throw new AppError('message is required', { code: 'VALIDATION_ERROR' });
  const replies = [...(ticket.replies || []), { from, adminName: req.user.name, message, at: new Date().toISOString() }];
  const updated = await repo.updateById(COLLECTIONS.SUPPORT_TICKETS, ticket._id, { $set: { replies, status: ticket.status === 'open' ? 'pending' : ticket.status } });
  return ok(res, updated, { message: 'Reply added' });
});

export const updateTicketStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['open', 'pending', 'resolved', 'closed'].includes(status)) throw new AppError('Invalid status', { code: 'VALIDATION_ERROR' });
  const ticket = await repo.updateById(COLLECTIONS.SUPPORT_TICKETS, req.params.id, { $set: { status } });
  if (!ticket) throw new AppError('Ticket not found', { status: 404, code: 'NOT_FOUND' });
  return ok(res, ticket, { message: 'Ticket status updated' });
});

const supportController = { createTicket, getMyTickets, getAllTickets, replyTicket, updateTicketStatus };
export default supportController;