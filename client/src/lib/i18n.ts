import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Language codes
export type Language = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'ar' | 'hi' | 'zh';

// Translation structure
export interface Translations {
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    create: string;
    search: string;
    filter: string;
    export: string;
    import: string;
    refresh: string;
    back: string;
    next: string;
    previous: string;
    confirm: string;
    yes: string;
    no: string;
    close: string;
    view: string;
    actions: string;
    status: string;
    date: string;
    time: string;
    name: string;
    description: string;
    type: string;
    all: string;
    none: string;
    select: string;
    selected: string;
    noData: string;
    logout: string;
    profile: string;
    settings: string;
  };
  auth: {
    login: string;
    logout: string;
    username: string;
    password: string;
    loginButton: string;
    loginError: string;
    loginSuccess: string;
    welcomeBack: string;
    signIn: string;
    rememberMe: string;
  };
  navigation: {
    dashboard: string;
    contacts: string;
    campaigns: string;
    templates: string;
    inbox: string;
    automations: string;
    messageLogs: string;
    analytics: string;
    settings: string;
    team: string;
    channels: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    overview: string;
    totalContacts: string;
    activeCampaigns: string;
    messagesDelivered: string;
    messagesFailed: string;
    messagesPending: string;
    messagesRead: string;
    recentActivity: string;
    totalMessagesSent: string;
    vsLastMonth: string;
    runningNow: string;
    deliveryRate: string;
    newLeads: string;
    thisWeek: string;
    messageAnalytics: string;
    '7Days': string;
    '30Days': string;
    '3Months': string;
    sent: string;
    delivered: string;
    read: string;
    replied: string;
    failed: string;
    recentActivities: string;
    noRecentCampaigns: string;
    createFirstCampaign: string;
    noContactsImported: string;
    importContactsToStart: string;
    noAutomationsActive: string;
    setupAutomationFlows: string;
    viewAllActivities: string;
    quickActions: string;
    importContacts: string;
    createCampaign: string;
    newCampaign: string;
    syncTemplates: string;
    viewAnalytics: string;
    apiStatusConnection: string;
    whatsAppCloudAPI: string;
    noChannelSelected: string;
    connected: string;
    warning: string;
    error: string;
    noChannel: string;
    channelQuality: string;
    rating: string;
    tier: string;
    apiUptime: string;
    avgResponse: string;
    dailyMessageLimit: string;
  };
  contacts: {
    title: string;
    addContact: string;
    importContacts: string;
    exportContacts: string;
    phoneNumber: string;
    email: string;
    firstName: string;
    lastName: string;
    tags: string;
    groups: string;
    createdAt: string;
    lastMessageAt: string;
    noContacts: string;
    deleteConfirm: string;
    importSuccess: string;
    importError: string;
    duplicatesFound: string;
    contactsAdded: string;
    selectFile: string;
    downloadTemplate: string;
    importFromCSV: string;
    manualEntry: string;
    contactDetails: string;
    conversationHistory: string;
    sendMessage: string;
    addToGroup: string;
    removeFromGroup: string;
    addTag: string;
    removeTag: string;
  };
  campaigns: {
    title: string;
    createCampaign: string;
    campaignName: string;
    campaignType: string;
    template: string;
    recipients: string;
    schedule: string;
    status: string;
    sent: string;
    delivered: string;
    read: string;
    failed: string;
    pending: string;
    active: string;
    completed: string;
    draft: string;
    scheduled: string;
    sendNow: string;
    scheduleFor: string;
    selectTemplate: string;
    selectContacts: string;
    selectGroups: string;
    uploadCSV: string;
    apiIntegration: string;
    testCampaign: string;
    launchCampaign: string;
    pauseCampaign: string;
    resumeCampaign: string;
    stopCampaign: string;
    campaignDetails: string;
    performance: string;
    recipientList: string;
    messagePreview: string;
    variableMapping: string;
    autoRetry: string;
    marketingMessage: string;
    transactionalMessage: string;
  };
  templates: {
    title: string;
    createTemplate: string;
    templateName: string;
    category: string;
    language: string;
    header: string;
    body: string;
    footer: string;
    buttons: string;
    media: string;
    preview: string;
    approved: string;
    pending: string;
    rejected: string;
    draft: string;
    syncTemplates: string;
    useTemplate: string;
    duplicateTemplate: string;
    deleteTemplate: string;
    variables: string;
    addVariable: string;
    mediaType: string;
    image: string;
    video: string;
    document: string;
    location: string;
    quickReply: string;
    callToAction: string;
    urlButton: string;
    phoneButton: string;
    exampleValues: string;
  };
  inbox: {
    title: string;
    conversations: string;
    unread: string;
    all: string;
    assigned: string;
    unassigned: string;
    open: string;
    closed: string;
    markAsRead: string;
    markAsUnread: string;
    assignTo: string;
    unassign: string;
    closeConversation: string;
    reopenConversation: string;
    typeMessage: string;
    sendMessage: string;
    attachFile: string;
    emoji: string;
    delivered: string;
    read: string;
    sent: string;
    failed: string;
    sending: string;
    searchConversations: string;
    filterByStatus: string;
    filterByAssignee: string;
    customerInfo: string;
    conversationHistory: string;
    internalNotes: string;
    addNote: string;
    assignedTo: string;
    lastMessage: string;
    startedAt: string;
    tags: string;
    noConversations: string;
    loadingMessages: string;
    endOfConversation: string;
    businessHoursMessage: string;
  };
  automations: {
    title: string;
    createAutomation: string;
    automationName: string;
    trigger: string;
    conditions: string;
    actions: string;
    active: string;
    inactive: string;
    executions: string;
    lastRun: string;
    enable: string;
    disable: string;
    test: string;
    duplicate: string;
    flowBuilder: string;
    addNode: string;
    deleteNode: string;
    userReply: string;
    timeGap: string;
    sendTemplate: string;
    customReply: string;
    keywordCatch: string;
    waitFor: string;
    timeout: string;
    messageText: string;
    keywords: string;
    dragToReorder: string;
    saveFlow: string;
    discardChanges: string;
    executionLogs: string;
    triggerType: string;
    messageReceived: string;
    keywordDetected: string;
    tagAdded: string;
    flowCompleted: string;
    flowFailed: string;
  };
  messageLogs: {
    title: string;
    messageId: string;
    recipient: string;
    template: string;
    campaign: string;
    status: string;
    sentAt: string;
    deliveredAt: string;
    readAt: string;
    failedAt: string;
    errorDetails: string;
    retryCount: string;
    viewDetails: string;
    retry: string;
    filterByStatus: string;
    filterByCampaign: string;
    filterByDate: string;
    exportLogs: string;
    noLogs: string;
    errorCode: string;
    errorMessage: string;
  };
  team: {
    title: string;
    addMember: string;
    editMember: string;
    deleteMember: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    permissions: string;
    active: string;
    inactive: string;
    lastActive: string;
    admin: string;
    manager: string;
    agent: string;
    inviteMember: string;
    resendInvite: string;
    revokeAccess: string;
    activityLog: string;
    assignedConversations: string;
    performance: string;
    responseTime: string;
    conversationsHandled: string;
    customerSatisfaction: string;
    sections: string;
    allSections: string;
    selectSections: string;
  };
  settings: {
    title: string;
    general: string;
    channels: string;
    webhooks: string;
    apiKeys: string;
    account: string;
    billing: string;
    notifications: string;
    security: string;
    channelName: string;
    phoneNumber: string;
    accessToken: string;
    webhookUrl: string;
    webhookSecret: string;
    testConnection: string;
    saveSettings: string;
    generateApiKey: string;
    revokeApiKey: string;
    apiKeyName: string;
    createdAt: string;
    lastUsed: string;
    changePassword: string;
    twoFactorAuth: string;
    enable: string;
    disable: string;
    emailNotifications: string;
    smsNotifications: string;
    webhookNotifications: string;
    language: string;
    timezone: string;
    dateFormat: string;
    theme: string;
    light: string;
    dark: string;
  };
  errors: {
    genericError: string;
    networkError: string;
    validationError: string;
    unauthorized: string;
    forbidden: string;
    notFound: string;
    serverError: string;
    badRequest: string;
    conflict: string;
    tooManyRequests: string;
    sessionExpired: string;
    invalidCredentials: string;
    requiredField: string;
    invalidFormat: string;
    minLength: string;
    maxLength: string;
    minValue: string;
    maxValue: string;
    invalidEmail: string;
    invalidPhone: string;
    invalidUrl: string;
    fileTooBig: string;
    unsupportedFileType: string;
    uploadFailed: string;
    downloadFailed: string;
  };
  success: {
    saved: string;
    created: string;
    updated: string;
    deleted: string;
    sent: string;
    imported: string;
    exported: string;
    connected: string;
    disconnected: string;
    enabled: string;
    disabled: string;
    completed: string;
    copied: string;
    uploaded: string;
    downloaded: string;
  };
}

// Language configurations
export const languages: Record<Language, { name: string; nativeName: string; direction: 'ltr' | 'rtl' }> = {
  en: { name: 'English', nativeName: 'English', direction: 'ltr' },
  es: { name: 'Spanish', nativeName: 'Español', direction: 'ltr' },
  fr: { name: 'French', nativeName: 'Français', direction: 'ltr' },
  de: { name: 'German', nativeName: 'Deutsch', direction: 'ltr' },
  pt: { name: 'Portuguese', nativeName: 'Português', direction: 'ltr' },
  ar: { name: 'Arabic', nativeName: 'العربية', direction: 'rtl' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr' },
  zh: { name: 'Chinese', nativeName: '中文', direction: 'ltr' },
};

// Import all translation files
import enTranslations from './translations/en.json';
import esTranslations from './translations/es.json';
import frTranslations from './translations/fr.json';
import deTranslations from './translations/de.json';
import ptTranslations from './translations/pt.json';
import arTranslations from './translations/ar.json';
import hiTranslations from './translations/hi.json';
import zhTranslations from './translations/zh.json';

const translations: Record<Language, Translations> = {
  en: enTranslations as Translations,
  es: esTranslations as Translations,
  fr: frTranslations as Translations, // fallback to English
  de: deTranslations as Translations, // fallback to English
  pt: ptTranslations as Translations, // fallback to English
  ar: arTranslations as Translations, // fallback to English
  hi: hiTranslations as Translations, // fallback to English
  zh: zhTranslations as Translations, // fallback to English
};

// i18n store
interface I18nState {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (path: string) => string;
  translations: Translations;
}

export const useI18n = create<I18nState>()((set, get) => ({
  language: 'en',
  translations: translations.en,
  setLanguage: (language: Language) => {
    set({ 
      language, 
      translations: translations[language] 
    });
    // Update document direction for RTL languages
    document.documentElement.dir = languages[language].direction;
    document.documentElement.lang = language;
  },
  t: (path: string) => {
    const state = get();
    const currentTranslations = state.translations || translations[state.language || 'en'] || translations.en;
    const keys = path.split('.');
    let value: any = currentTranslations;
    
    for (const key of keys) {
      value = value?.[key];
      if (!value) break;
    }
    
    return value || path;
  },
}));

// Helper hook for translations
export function useTranslation() {
  const { t, language, setLanguage, translations } = useI18n();
  return { t, language, setLanguage, translations, languages };
}