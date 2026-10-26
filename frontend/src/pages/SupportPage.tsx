import React, { useState, useEffect } from 'react';
import {
  LifeBuoy, Plus, MessageSquare, Send, CheckCircle2,
  AlertCircle, Clock, User
} from 'lucide-react';
import { api } from '../services/api';
import { SupportTicket } from '../types';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';

export const SupportPage: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);

  // New ticket modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [priority, setPriority] = useState('MEDIUM');
  const [initialMessage, setInitialMessage] = useState('');

  // Reply message
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await api.getSupportTickets();
      setTickets(res || []);
      if (res && res.length > 0 && !selectedTicket) {
        setSelectedTicket(res[0]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.createSupportTicket({
        subject,
        category,
        priority,
        initial_message: initialMessage,
      });
      setSuccess(`Ticket ${res.ticket_number} created successfully! Our team has been notified.`);
      setSubject('');
      setInitialMessage('');
      setShowNewModal(false);
      loadTickets();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;
    setSending(true);
    try {
      await api.addSupportMessage(selectedTicket.id, replyText);
      setReplyText('');
      // Reload ticket detail
      const updatedList = await api.getSupportTickets();
      setTickets(updatedList || []);
      const current = updatedList.find((t: any) => t.id === selectedTicket.id);
      if (current) setSelectedTicket(current);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-semibold mb-2">
            <LifeBuoy className="w-3.5 h-3.5 text-blue-600" />
            Customer Service & Support
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Support Desk & Inquiries
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Submit inquiries, report concerns, and track resolutions directly with bank staff.
          </p>
        </div>
        <button
          onClick={() => {
            setError(null);
            setShowNewModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 shadow-sm flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Support Ticket
        </button>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-700 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Main Grid: Ticket List & Conversation Thread */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ticket List (1 col) */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            My Tickets ({tickets.length})
          </h2>
          {tickets.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
              No support tickets found. Click "Create Support Ticket" to start an inquiry.
            </div>
          ) : (
            tickets.map((ticket) => {
              const isSelected = selectedTicket?.id === ticket.id;
              return (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-900 text-white border-blue-700 shadow-md ring-2 ring-blue-600'
                      : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="font-mono text-[10px] font-bold opacity-75">{ticket.ticket_number}</span>
                    <Badge variant={ticket.status === 'RESOLVED' ? 'success' : ticket.status === 'WAITING_CUSTOMER' ? 'warning' : 'info'}>
                      {ticket.status}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-xs line-clamp-1 mb-2">{ticket.subject}</h3>
                  <div className={`flex justify-between text-[10px] ${isSelected ? 'text-blue-300' : 'text-slate-400'}`}>
                    <span>{ticket.category}</span>
                    <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Conversation Thread (2 cols) */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-[600px] overflow-hidden">
              {/* Ticket Top bar */}
              <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {selectedTicket.ticket_number}
                    </span>
                    <h2 className="text-sm font-bold text-slate-900">{selectedTicket.subject}</h2>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Category: <strong>{selectedTicket.category}</strong> &bull; Priority: <strong>{selectedTicket.priority}</strong>
                  </div>
                </div>
                <Badge variant={selectedTicket.status === 'RESOLVED' ? 'success' : 'info'}>
                  {selectedTicket.status}
                </Badge>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {selectedTicket.messages?.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.is_staff_reply ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-700">{msg.sender_name}</span>
                      {msg.is_staff_reply && (
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-bold">
                          Staff
                        </span>
                      )}
                      <span>&bull;</span>
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div
                      className={`p-3.5 rounded-2xl text-xs max-w-lg leading-relaxed ${
                        msg.is_staff_reply
                          ? 'bg-slate-100 text-slate-800 rounded-tl-sm'
                          : 'bg-blue-600 text-white rounded-tr-sm shadow-sm'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-2">
                <input
                  type="text"
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your response to the bank staff..."
                  className="flex-1 text-xs border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
              Select a ticket to view the conversation thread.
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="Open New Support Ticket">
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Question about savings circle payout rules"
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
              >
                <option value="GENERAL">General Inquiry</option>
                <option value="ACCOUNT">Account & Profile</option>
                <option value="TRANSACTION">Transaction Discrepancy</option>
                <option value="SAVINGS">Savings & Circles</option>
                <option value="LOANS">Microloan</option>
                <option value="SECURITY">Security / Fraud Concern</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Message</label>
            <textarea
              rows={4}
              required
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              placeholder="Describe your question or issue in detail..."
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm"
          >
            Submit Ticket
          </button>
        </form>
      </Modal>
    </div>
  );
};
