const API_BASE_URL = '/api/v1';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('smartbank_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Clear token if expired or invalid
      localStorage.removeItem('smartbank_token');
      localStorage.removeItem('smartbank_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }

    if (!response.ok) {
      let errMessage = 'An unexpected error occurred';
      try {
        const errorData = await response.json();
        errMessage = errorData.error || errorData.detail || errorData.non_field_errors?.[0] || JSON.stringify(errorData);
      } catch (e) {
        errMessage = response.statusText;
      }
      throw new Error(errMessage);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  private async requestList<T>(endpoint: string, options: RequestInit = {}): Promise<T[]> {
    const data = await this.request<any>(endpoint, options);
    if (data && Array.isArray(data.results)) {
      return data.results;
    }
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  }

  // Auth & Accounts
  async register(data: any) {
    return this.request<{ token: string; user: any; primary_account: any }>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }) {
    return this.request<{ token: string; user: any }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout() {
    return this.request('/auth/logout/', { method: 'POST' });
  }

  async getMe() {
    return this.request<any>('/auth/me/');
  }

  async updateProfile(data: any) {
    return this.request<any>('/auth/me/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getCustomers(params?: string) {
    return this.requestList<any>(`/auth/customers/${params ? '?' + params : ''}`);
  }

  async verifyCustomer(userId: string, data: { status: string; notes?: string }) {
    return this.request<any>(`/auth/customers/${userId}/verify/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAuditLogs() {
    return this.requestList<any>('/auth/audit-logs/');
  }

  // Banking
  async getAccounts() {
    return this.requestList<any>('/banking/accounts/');
  }

  async getAccount(id: string) {
    return this.request<any>(`/banking/accounts/${id}/`);
  }

  async openAccount(data: { account_type: string; initial_deposit: number }) {
    return this.request<any>('/banking/accounts/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async setAccountStatus(accountId: string, status: string, reason?: string) {
    return this.request<any>(`/banking/accounts/${accountId}/status/`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  }

  async getTransactions(params?: string) {
    return this.requestList<any>(`/banking/transactions/${params ? '?' + params : ''}`);
  }

  async getTransaction(id: string) {
    return this.request<any>(`/banking/transactions/${id}/`);
  }

  async transfer(data: { source_account_id: string; destination_account_number: string; amount: number; description?: string }) {
    return this.request<any>('/banking/transactions/transfer/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deposit(data: { account_id: string; amount: number; description?: string }) {
    return this.request<any>('/banking/transactions/deposit/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async withdraw(data: { account_id: string; amount: number; description?: string }) {
    return this.request<any>('/banking/transactions/withdraw/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async reverseTransaction(transactionId: string, reason: string) {
    return this.request<any>(`/banking/transactions/${transactionId}/reverse/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async reportTransaction(transactionId: string, reason: string) {
    return this.request<any>(`/banking/transactions/${transactionId}/report/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Savings & Circles
  async getSavingsGoals() {
    return this.requestList<any>('/savings/goals/');
  }

  async createSavingsGoal(data: any) {
    return this.request<any>('/savings/goals/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async fundSavingsGoal(goalId: string, data: { source_account_id: string; amount: number; notes?: string }) {
    return this.request<any>(`/savings/goals/${goalId}/fund/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSavingsCircles() {
    return this.requestList<any>('/savings/circles/');
  }

  async getSavingsCircle(id: string) {
    return this.request<any>(`/savings/circles/${id}/`);
  }

  async createSavingsCircle(data: any) {
    return this.request<any>('/savings/circles/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async joinSavingsCircle(circleId: string) {
    return this.request<any>(`/savings/circles/${circleId}/join/`, {
      method: 'POST',
    });
  }

  async contributeToCircle(circleId: string, data: { account_id: string; amount?: number; notes?: string }) {
    return this.request<any>(`/savings/circles/${circleId}/contribute/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async proposeCirclePayout(circleId: string, data: { recipient_id: string; amount?: number; notes?: string }) {
    return this.request<any>(`/savings/circles/${circleId}/propose-payout/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async approveCirclePayout(circleId: string, payoutId: string) {
    return this.request<any>(`/savings/circles/${circleId}/payouts/${payoutId}/approve/`, {
      method: 'POST',
    });
  }

  // Loans
  async calculateLoan(data: { amount: number; term_months: number; monthly_interest_rate?: number }) {
    return this.request<any>('/loans/calculate/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getLoanApplications(params?: string) {
    return this.requestList<any>(`/loans/applications/${params ? '?' + params : ''}`);
  }

  async applyLoan(data: any) {
    return this.request<any>('/loans/applications/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async decideLoan(loanId: string, data: { status: string; reason?: string; staff_notes?: string }) {
    return this.request<any>(`/loans/applications/${loanId}/decision/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async repayLoan(loanId: string, data: { account_id: string }) {
    return this.request<any>(`/loans/applications/${loanId}/repay/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Security
  async getSecurityAlerts(params?: string) {
    return this.requestList<any>(`/security/alerts/${params ? '?' + params : ''}`);
  }

  async resolveSecurityAlert(alertId: string, data: { status: string; notes?: string }) {
    return this.request<any>(`/security/alerts/${alertId}/resolve/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSecurityRules() {
    return this.requestList<any>('/security/rules/');
  }

  // Notifications
  async getNotifications() {
    return this.request<{ unread_count: number; results: any[] }>('/notifications/');
  }

  async markNotificationRead(id: string) {
    return this.request(`/notifications/${id}/read/`, { method: 'POST' });
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/read-all/', { method: 'POST' });
  }

  // Support
  async getSupportTickets(params?: string) {
    return this.requestList<any>(`/support/tickets/${params ? '?' + params : ''}`);
  }

  async createSupportTicket(data: any) {
    return this.request<any>('/support/tickets/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addSupportMessage(ticketId: string, message: string) {
    return this.request<any>(`/support/tickets/${ticketId}/message/`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async updateTicketStatus(ticketId: string, status: string, resolution_notes?: string) {
    return this.request<any>(`/support/tickets/${ticketId}/status/`, {
      method: 'PATCH',
      body: JSON.stringify({ status, resolution_notes }),
    });
  }

  // Reporting
  async getInstitutionalOverview() {
    return this.request<any>('/reporting/overview/');
  }

  getExportCsvUrl() {
    return `${API_BASE_URL}/reporting/export/transactions/`;
  }
}

export const api = new ApiClient();
