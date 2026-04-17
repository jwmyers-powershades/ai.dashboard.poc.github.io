// Seed data and localStorage data management

const STORAGE_KEY = 'ps_ai_dashboard_submissions';
const INIT_KEY    = 'ps_ai_dashboard_initialized';

const TOOLS = [
    {
        id: 'tool-1',
        name: 'Microsoft Copilot',
        description: 'AI assistant integrated across Microsoft 365 — helps draft emails, summarize documents, generate presentations, and analyze Excel data.',
        url: 'https://copilot.microsoft.com',
        category: 'Productivity',
        icon: 'bi-microsoft',
        iconBg: '#f0f4ff',
        iconColor: '#0078d4',
        approvedDate: '2025-01-15',
        guidelines: 'Do not input confidential customer data. Approved for internal documents and general business tasks.'
    },
    {
        id: 'tool-2',
        name: 'GitHub Copilot',
        description: 'AI-powered code completion and generation for developers. Suggests code, functions, and unit tests directly inside your IDE.',
        url: 'https://github.com/features/copilot',
        category: 'Development',
        icon: 'bi-code-slash',
        iconBg: '#f0fdf4',
        iconColor: '#16a34a',
        approvedDate: '2025-01-15',
        guidelines: 'Review all generated code before committing. Do not use with proprietary algorithms or sensitive business logic.'
    },
    {
        id: 'tool-3',
        name: 'Claude (claude.ai)',
        description: 'General-purpose AI assistant from Anthropic. Excellent for analysis, writing, summarization, research, and complex reasoning.',
        url: 'https://claude.ai',
        category: 'General Purpose',
        icon: 'bi-robot',
        iconBg: '#fdf4ff',
        iconColor: '#9333ea',
        approvedDate: '2025-02-01',
        guidelines: 'Do not share customer PII or trade secrets. Use the Pro tier for business tasks. Enterprise licensing available through IT.'
    },
    {
        id: 'tool-4',
        name: 'Power BI Copilot',
        description: 'AI capabilities built into Microsoft Power BI — generates reports, writes DAX formulas, interprets data, and answers analytics questions.',
        url: 'https://powerbi.microsoft.com',
        category: 'Analytics',
        icon: 'bi-bar-chart-fill',
        iconBg: '#fff7ed',
        iconColor: '#ea580c',
        approvedDate: '2025-02-10',
        guidelines: 'Approved for internal business analytics. Data must reside in approved Power BI workspaces only.'
    },
    {
        id: 'tool-5',
        name: 'Microsoft Copilot Studio',
        description: 'Low-code platform for building custom AI-powered chatbots and copilots for internal workflows or customer-facing applications.',
        url: 'https://copilotstudio.microsoft.com',
        category: 'Development',
        icon: 'bi-puzzle-fill',
        iconBg: '#eff6ff',
        iconColor: '#2563eb',
        approvedDate: '2025-03-01',
        guidelines: 'For IT/Dev teams only. All copilots must be reviewed by the committee before deployment. Data sources must be pre-approved.'
    },
    {
        id: 'tool-6',
        name: 'Adobe Firefly',
        description: 'AI image generation trained exclusively on licensed content. Create marketing assets, product imagery, and visual concepts safely.',
        url: 'https://firefly.adobe.com',
        category: 'Creative',
        icon: 'bi-image-fill',
        iconBg: '#fef2f2',
        iconColor: '#dc2626',
        approvedDate: '2025-03-15',
        guidelines: 'Approved for marketing and creative use. AI-generated images for external use require review by the Marketing team.'
    }
];

const MODELS = [
    {
        id: 'model-1',
        name: 'Claude Sonnet 4.6',
        provider: 'Anthropic',
        status: 'active',
        description: 'Highly capable model for complex reasoning, analysis, and content generation. Current default for most AI tasks.',
        approvedUses: ['Document summarization', 'Content drafting & editing', 'Code review & generation', 'Data analysis & insights', 'Internal research'],
        restrictions: 'No PII. No trade secrets. Internal use only.',
        dataClassification: 'Internal — Confidential',
        approvedDate: '2025-02-01'
    },
    {
        id: 'model-2',
        name: 'GPT-4o',
        provider: 'OpenAI',
        status: 'active',
        description: 'OpenAI flagship multimodal model handling text, images, and complex reasoning tasks.',
        approvedUses: ['Complex document analysis', 'Image & document OCR', 'Advanced code generation', 'Business writing', 'Research synthesis'],
        restrictions: 'No PII. No financial data. Use only via approved interfaces.',
        dataClassification: 'Internal — Non-confidential only',
        approvedDate: '2025-01-15'
    },
    {
        id: 'model-3',
        name: 'GPT-4o mini',
        provider: 'OpenAI',
        status: 'active',
        description: 'Faster, lower-cost version of GPT-4o. Ideal for quick tasks, classification, and high-volume applications.',
        approvedUses: ['Quick content generation', 'Classification tasks', 'Simple Q&A', 'Draft suggestions', 'Automated summarization'],
        restrictions: 'No PII. No sensitive data. Non-critical tasks only.',
        dataClassification: 'Public — Internal use',
        approvedDate: '2025-01-15'
    },
    {
        id: 'model-4',
        name: 'Claude Haiku 4.5',
        provider: 'Anthropic',
        status: 'active',
        description: 'Fast, lightweight Anthropic model for quick responses and high-throughput scenarios where speed matters.',
        approvedUses: ['Real-time assistance', 'Quick classification', 'Short content generation', 'FAQ responses', 'Form data extraction'],
        restrictions: 'No sensitive data. Lightweight tasks only.',
        dataClassification: 'Public — Internal use',
        approvedDate: '2025-02-15'
    },
    {
        id: 'model-5',
        name: 'GitHub Copilot (Codex)',
        provider: 'GitHub / OpenAI',
        status: 'active',
        description: 'Specialized code generation model integrated into IDEs. Approved for software development use cases only.',
        approvedUses: ['Code completion', 'Function generation', 'Unit test generation', 'Code documentation', 'Bug fix suggestions'],
        restrictions: 'Do not use with proprietary algorithms or IP-sensitive code without prior review.',
        dataClassification: 'Internal code only',
        approvedDate: '2025-01-15'
    },
    {
        id: 'model-6',
        name: 'DALL-E 3 (via Adobe)',
        provider: 'OpenAI / Adobe',
        status: 'restricted',
        description: 'Image generation model accessible only through the approved Adobe Firefly interface.',
        approvedUses: ['Marketing imagery', 'Concept visualization', 'Presentation graphics'],
        restrictions: 'Creative/Marketing team only. All outputs require human review before external use. No likenesses of real people.',
        dataClassification: 'Creative assets — public safe',
        approvedDate: '2025-03-15'
    },
    {
        id: 'model-7',
        name: 'Microsoft Phi-4',
        provider: 'Microsoft',
        status: 'review',
        description: 'Small language model being evaluated for on-premise and edge deployment scenarios.',
        approvedUses: ['Under evaluation — pilot only'],
        restrictions: 'Not approved for production use. Pilot/sandbox testing only by IT team.',
        dataClassification: 'Evaluation only',
        approvedDate: null
    }
];

const SEED_SUBMISSIONS = [
    {
        id: 'sub-001',
        title: 'AI-Powered Shade Configuration Assistant',
        name: 'Sarah Johnson',
        email: 'sjohnson@powershades.com',
        department: 'Sales',
        role: 'Sales Representative',
        problem: 'Our sales team spends significant time helping customers configure custom shade solutions. The process requires consulting multiple spec sheets and pricing tables, leading to errors and slow quote turnaround.',
        solution: 'Build a Claude-powered assistant that ingests our product catalog and spec sheets. Reps and customers describe requirements in natural language and receive instant configuration recommendations and rough quotes.',
        benefits: 'Estimated 40% reduction in quote preparation time. Fewer configuration errors. Ability to handle initial customer inquiries after hours.',
        tools: 'Claude (claude.ai), Microsoft Copilot Studio',
        effort: 'medium',
        dataConcerns: 'Would need access to product catalog and pricing data. No customer PII required for the initial configuration step.',
        status: 'pending',
        submittedAt: '2025-04-10T14:30:00Z',
        reviewNotes: '',
        reviewedBy: '',
        reviewedAt: null
    },
    {
        id: 'sub-002',
        title: 'Automated Invoice Data Extraction',
        name: 'Marcus Chen',
        email: 'mchen@powershades.com',
        department: 'Finance',
        role: 'Finance Manager',
        problem: 'Our AP team manually keys data from supplier invoices into the ERP system. With 200+ invoices per month, this is time-consuming and error-prone.',
        solution: 'Use GPT-4o vision to automatically extract invoice data (vendor, amounts, line items, dates) and pre-populate the ERP system. A human review step catches errors before posting.',
        benefits: '75% reduction in manual data entry. Faster invoice processing. Lower error rate. Finance staff freed to focus on exceptions and analysis.',
        tools: 'GPT-4o, Power Automate',
        effort: 'medium',
        dataConcerns: 'Invoice data includes vendor financial information. Need to confirm data handling requirements against vendor contracts.',
        status: 'accepted',
        submittedAt: '2025-03-28T09:15:00Z',
        reviewNotes: 'Strong use case with clear ROI. Finance team to pilot with 3 key vendors. IT to assess ERP API capabilities. Target: Q2 2025 pilot launch.',
        reviewedBy: 'AI Innovation Committee',
        reviewedAt: '2025-04-02T11:00:00Z'
    },
    {
        id: 'sub-003',
        title: 'AI Meeting Summarization',
        name: 'Lisa Park',
        email: 'lpark@powershades.com',
        department: 'HR',
        role: 'HR Business Partner',
        problem: 'Team members who miss all-hands meetings or project syncs have no easy way to catch up. Video recordings exist but are rarely watched in full.',
        solution: 'Automatically transcribe meeting recordings using Microsoft Copilot and generate structured summaries with key decisions, action items, and follow-up dates. Distribute via Teams.',
        benefits: 'Improved team alignment. Better follow-through on action items. Accessible for distributed teams and time zones.',
        tools: 'Microsoft Copilot, Teams',
        effort: 'low',
        dataConcerns: 'Meeting content may include sensitive HR or business strategy. Summaries would need appropriate access controls.',
        status: 'accepted',
        submittedAt: '2025-03-20T16:00:00Z',
        reviewNotes: 'Approved. Microsoft Copilot already licensed for this capability. IT to configure recording permissions. Quick win — targeted for Q1 rollout.',
        reviewedBy: 'AI Innovation Committee',
        reviewedAt: '2025-03-25T10:00:00Z'
    },
    {
        id: 'sub-004',
        title: 'Predictive Inventory Management',
        name: 'David Torres',
        email: 'dtorres@powershades.com',
        department: 'Operations',
        role: 'Supply Chain Manager',
        problem: 'We frequently face stockouts on key shade components or excess inventory on slow-moving items. Current forecasting relies on manual spreadsheet analysis.',
        solution: 'Use AI to analyze historical sales data, seasonal patterns, and supplier lead times to generate weekly inventory reorder recommendations.',
        benefits: 'Reduce stockouts by ~30%. Reduce excess inventory by ~20%. Free up working capital. Reduce manual analysis time significantly.',
        tools: 'Power BI Copilot, Azure ML (future)',
        effort: 'high',
        dataConcerns: 'Uses sales history and inventory data only. Internal only — no external data sharing required.',
        status: 'deferred',
        submittedAt: '2025-04-05T11:30:00Z',
        reviewNotes: 'Strong business case but requires data infrastructure not yet in place. Data warehouse project must complete first. Revisit in Q3 2025.',
        reviewedBy: 'AI Innovation Committee',
        reviewedAt: '2025-04-08T09:00:00Z'
    },
    {
        id: 'sub-005',
        title: 'Customer-Facing AI Chat on Website',
        name: 'Amanda Foster',
        email: 'afoster@powershades.com',
        department: 'Marketing',
        role: 'Digital Marketing Manager',
        problem: 'Website visitors frequently have product questions that go unanswered outside business hours, leading to lost leads.',
        solution: 'Deploy an AI chatbot on the public website that answers product questions, provides sizing guidance, and captures lead information.',
        benefits: 'Capture leads 24/7. Reduce load on sales team for basic inquiries. Improve customer experience and response times.',
        tools: 'Microsoft Copilot Studio, Claude API',
        effort: 'medium',
        dataConcerns: 'Would interact with external customers. Must not collect PII without consent. Requires GDPR/privacy compliance review.',
        status: 'declined',
        submittedAt: '2025-03-15T13:00:00Z',
        reviewNotes: 'Declined at this time. Legal raised GDPR/privacy compliance concerns for customer-facing AI. Brand voice review also required. Resubmit once the privacy framework is established.',
        reviewedBy: 'AI Innovation Committee',
        reviewedAt: '2025-03-22T14:00:00Z'
    }
];

const DataStore = {
    getSubmissions() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    },

    saveSubmissions(submissions) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
    },

    addSubmission(submission) {
        const submissions = this.getSubmissions();
        submissions.unshift(submission);
        this.saveSubmissions(submissions);
        return submission;
    },

    updateSubmission(id, updates) {
        const submissions = this.getSubmissions();
        const idx = submissions.findIndex(s => s.id === id);
        if (idx !== -1) {
            submissions[idx] = { ...submissions[idx], ...updates };
            this.saveSubmissions(submissions);
            return submissions[idx];
        }
        return null;
    },

    getSubmission(id) {
        return this.getSubmissions().find(s => s.id === id) || null;
    },

    generateId() {
        return 'sub-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    },

    getTools()  { return TOOLS; },
    getModels() { return MODELS; },

    init() {
        if (!localStorage.getItem(INIT_KEY)) {
            this.saveSubmissions(SEED_SUBMISSIONS);
            localStorage.setItem(INIT_KEY, 'true');
        }
    }
};

DataStore.init();
