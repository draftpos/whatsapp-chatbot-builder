import { apiRequest } from "./queryClient";

export const api = {
  // Dashboard
  getDashboardStats: (channelId?: string) => apiRequest("GET", `/api/dashboard/stats${channelId ? `?channelId=${channelId}` : ""}`),
  getAnalytics: (days?: number, channelId?: string) => {
    const params = new URLSearchParams();
    if (days) params.append('days', days.toString());
    if (channelId) params.append('channelId', channelId);
    return apiRequest("GET", `/api/analytics${params.toString() ? `?${params.toString()}` : ""}`);
  },

  getContacts: (search?: string, channelId?: string, page?: number, limit?: number, groupFilter?: string, statusFilter?: string) => {
    const params = new URLSearchParams();
    
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    if (channelId) {
      params.append('channelId', channelId);
    }
    if (page) {
      params.append('page', page.toString());
    }
    if (limit) {
      params.append('limit', limit.toString());
    }
    if (groupFilter) {
      params.append('group', groupFilter);
    }
    if (statusFilter) {
      params.append('status', statusFilter);
    }
    
    const queryString = params.toString();

    // console.log(`Fetching contacts with query:===>> /api/contacts${queryString ? `?${queryString}` : ""}`);
    return apiRequest("GET", `/api/contacts${queryString ? `?${queryString}` : ""}`);
  },
  getContact: (id: string) => apiRequest("GET", `/api/contacts/${id}`),
  createContact: (data: any, channelId?: string) => apiRequest("POST", `/api/contacts${channelId ? `?channelId=${channelId}` : ""}`, data),
  updateContact: (id: string, data: any) => apiRequest("PUT", `/api/contacts/${id}`, data),
  deleteContact: (id: string) => apiRequest("DELETE", `/api/contacts/${id}`),

  // Campaigns
  getCampaigns: (channelId?: string) => apiRequest("GET", `/api/campaigns${channelId ? `?channelId=${channelId}` : ""}`),
  getCampaign: (id: string) => apiRequest("GET", `/api/campaigns/${id}`),
  createCampaign: (data: any, channelId?: string) => apiRequest("POST", `/api/campaigns${channelId ? `?channelId=${channelId}` : ""}`, data),
  updateCampaign: (id: string, data: any) => apiRequest("PUT", `/api/campaigns/${id}`, data),
  deleteCampaign: (id: string) => apiRequest("DELETE", `/api/campaigns/${id}`),

  // Templates
  getTemplates: (channelId?: string) => apiRequest("GET", `/api/templates${channelId ? `?channelId=${channelId}` : ""}`),
  getTemplate: (id: string) => apiRequest("GET", `/api/templates/${id}`),
  createTemplate: (data: any) => apiRequest("POST", "/api/templates", data),
  updateTemplate: (id: string, data: any) => apiRequest("PUT", `/api/templates/${id}`, data),
  deleteTemplate: (id: string) => apiRequest("DELETE", `/api/templates/${id}`),

  // Conversations
  getConversations: (channelId?: string) => apiRequest("GET", `/api/conversations${channelId ? `?channelId=${channelId}` : ""}`),
  getConversation: (id: string) => apiRequest("GET", `/api/conversations/${id}`),
  createConversation: (data: any) => apiRequest("POST", "/api/conversations", data),
  updateConversation: (id: string, data: any) => apiRequest("PUT", `/api/conversations/${id}`, data),

  // Messages
  getMessages: (conversationId: string) => apiRequest("GET", `/api/conversations/${conversationId}/messages`),
  createMessage: (conversationId: string, data: any) => apiRequest("POST", `/api/conversations/${conversationId}/messages`, data),

  // Automations
  getAutomations: (channelId?: string) => apiRequest("GET", `/api/automations${channelId ? `?channelId=${channelId}` : ""}`),
  getAutomation: (id: string) => apiRequest("GET", `/api/automations/${id}`),
  createAutomation: (data: any, channelId?: string) => apiRequest("POST", `/api/automations${channelId ? `?channelId=${channelId}` : ""}`, data),
  updateAutomation: (id: string, data: any) => apiRequest("PUT", `/api/automations/${id}`, data),
  deleteAutomation: (id: string) => apiRequest("DELETE", `/api/automations/${id}`),
};
