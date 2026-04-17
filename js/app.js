const STATUS_SERVICES = [
    {
        id: 'claude',
        name: 'Claude',
        description: 'Anthropic AI Assistant',
        statusUrl: 'https://status.claude.com',
        apiUrl: 'https://status.claude.com/api/v2/summary.json',
        icon: 'bi-robot',
        iconBg: '#fdf4ff',
        iconColor: '#9333ea'
    },
    {
        id: 'cursor',
        name: 'Cursor',
        description: 'AI Code Editor',
        statusUrl: 'https://status.cursor.com',
        apiUrl: 'https://status.cursor.com/api/v2/summary.json',
        icon: 'bi-cursor-text',
        iconBg: '#eff6ff',
        iconColor: '#2563eb'
    },
    {
        id: 'chatgpt',
        name: 'ChatGPT',
        description: 'OpenAI Chat Interface',
        statusUrl: 'https://status.chatgpt.com',
        apiUrl: 'https://status.chatgpt.com/api/v2/summary.json',
        icon: 'bi-chat-dots-fill',
        iconBg: '#f0fdf4',
        iconColor: '#059669'
    },
    {
        id: 'lindy',
        name: 'Lindy',
        description: 'AI Automation Platform',
        statusUrl: 'https://status.lindy.ai',
        apiUrl: null,
        scrapeUrl: 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://status.lindy.ai'),
        icon: 'bi-link-45deg',
        iconBg: '#fff7ed',
        iconColor: '#ea580c'
    }
];

const App = {
    currentSection: 'status',
    isAuthenticated: false,
    currentFilter: 'pending',
    statusInterval: null,
    COMMITTEE_PASSWORD: 'committee',

    init() {
        this.setupNavigation();
        this.setupSidebarToggle();
        this.setupSubmitForm();
        this.setupCommitteeAuth();
        this.setupCommitteeTabs();
        this.setupStatusRefreshBtn();
        this.renderSection('status');
    },

    // ===== NAVIGATION =====

    setupNavigation() {
        document.querySelectorAll('[data-section]').forEach(el => {
            el.addEventListener('click', e => {
                e.preventDefault();
                this.navigate(el.dataset.section);
            });
        });

        document.querySelectorAll('[data-nav]').forEach(el => {
            el.addEventListener('click', e => {
                e.preventDefault();
                this.navigate(el.dataset.nav);
            });
        });
    },

    navigate(section) {
        // Stop auto-refresh when leaving status page
        if (this.currentSection === 'status' && section !== 'status') {
            clearInterval(this.statusInterval);
            this.statusInterval = null;
        }

        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.toggle('active', link.dataset.section === section);
        });

        const titles = {
            status:    'Status',
            overview:  'Overview',
            tools:     'Approved Tools',
            models:    'AI Models',
            submit:    'Submit Idea',
            committee: 'Committee Review'
        };

        const title = titles[section] || section;
        document.getElementById('page-title').textContent = title;
        const crumb = document.getElementById('breadcrumb-current');
        if (crumb) crumb.textContent = title;

        document.querySelectorAll('.content-section').forEach(s => s.classList.add('d-none'));
        document.getElementById(`section-${section}`)?.classList.remove('d-none');

        this.currentSection = section;
        this.renderSection(section);

        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebar-overlay').classList.remove('active');
    },

    renderSection(section) {
        const map = {
            status:    () => this.renderStatus(),
            overview:  () => this.renderOverview(),
            tools:     () => this.renderTools(),
            models:    () => this.renderModels(),
            submit:    () => this.renderSubmit(),
            committee: () => this.renderCommittee()
        };
        map[section]?.();
    },

    setupSidebarToggle() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        });
        overlay?.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    },

    // ===== STATUS =====

    setupStatusRefreshBtn() {
        document.getElementById('status-refresh-btn')?.addEventListener('click', () => {
            this.renderStatus();
        });
    },

    renderStatus() {
        const cardsEl = document.getElementById('status-cards');
        if (!cardsEl) return;

        // Show spinner placeholders while fetching
        cardsEl.innerHTML = STATUS_SERVICES.map(svc => [
            '<div class="col-md-6">',
            '  <div class="status-service-card" style="pointer-events:none;min-height:120px;">',
            '    <div class="status-card-top">',
            '      <div class="d-flex gap-3 align-items-center">',
            '        <div class="status-service-icon" style="background:' + svc.iconBg + ';color:' + svc.iconColor + ';">',
            '          <i class="bi ' + svc.icon + '"></i>',
            '        </div>',
            '        <div>',
            '          <div class="status-service-name">' + svc.name + '</div>',
            '          <div class="status-service-desc">' + svc.description + '</div>',
            '        </div>',
            '      </div>',
            '      <div class="spinner-border spinner-border-sm text-secondary ms-auto" role="status"></div>',
            '    </div>',
            '    <div class="status-overall-desc text-muted">Checking status\u2026</div>',
            '  </div>',
            '</div>'
        ].join('\n')).join('\n');

        const bannerEl = document.getElementById('status-overall-banner');
        if (bannerEl) bannerEl.innerHTML = '';

        const btn = document.getElementById('status-refresh-btn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="bi bi-arrow-clockwise me-1 spin"></i>Refreshing\u2026';
        }

        // Fetch all in parallel; render once every promise has settled
        Promise.allSettled(STATUS_SERVICES.map(svc => this.fetchServiceStatus(svc)))
            .then(settled => {
                const dataArr = settled.map(r => r.status === 'fulfilled' ? r.value : null);

                let html = '';
                for (let i = 0; i < STATUS_SERVICES.length; i++) {
                    try {
                        html += this.buildStatusCard(STATUS_SERVICES[i], dataArr[i]);
                    } catch (e) {
                        html += this.buildErrorCard(STATUS_SERVICES[i]);
                    }
                }
                cardsEl.innerHTML = html;

                this.renderStatusBanner(dataArr);

                const lastEl = document.getElementById('status-last-refreshed');
                if (lastEl) {
                    lastEl.textContent = 'Updated ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }

                const freshBtn = document.getElementById('status-refresh-btn');
                if (freshBtn) {
                    freshBtn.disabled = false;
                    freshBtn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i>Refresh';
                }
            });

        // Auto-refresh every 60 s while on this page
        clearInterval(this.statusInterval);
        this.statusInterval = setInterval(() => {
            if (this.currentSection === 'status') this.renderStatus();
        }, 60000);
    },

    buildErrorCard(svc) {
        return [
            '<div class="col-md-6">',
            '  <a href="' + svc.statusUrl + '" target="_blank" rel="noopener noreferrer" class="status-service-card">',
            '    <div class="status-card-top">',
            '      <div class="d-flex gap-3 align-items-center">',
            '        <div class="status-service-icon" style="background:' + svc.iconBg + ';color:' + svc.iconColor + ';">',
            '          <i class="bi ' + svc.icon + '"></i>',
            '        </div>',
            '        <div><div class="status-service-name">' + svc.name + '</div><div class="status-service-desc">' + svc.description + '</div></div>',
            '      </div>',
            '      <span class="badge status-badge-unknown px-2 py-1" style="font-size:11px;">Unknown</span>',
            '    </div>',
            '    <div class="status-overall-desc text-muted">Status unavailable \u2014 click to check manually.</div>',
            '    <div class="status-card-footer"><span>View full status page <i class="bi bi-box-arrow-up-right ms-1"></i></span></div>',
            '  </a>',
            '</div>'
        ].join('\n');
    },

    async fetchServiceStatus(svc) {
        if (!svc.apiUrl && svc.scrapeUrl) {
            return this.scrapeServiceStatus(svc);
        }
        try {
            const res = await fetch(svc.apiUrl, {
                mode: 'cors',
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(8000)
            });
            if (!res.ok) return null;
            return await res.json();
        } catch {
            return null;
        }
    },

    async scrapeServiceStatus(svc) {
        try {
            const res = await fetch(svc.scrapeUrl, { signal: AbortSignal.timeout(10000) });
            if (!res.ok) return null;
            const html = await res.text();
            return this.parseStatusFromHtml(html);
        } catch {
            return null;
        }
    },

    parseStatusFromHtml(html) {
        // Strip scripts/styles to avoid keyword matches in code
        var text = html
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .toLowerCase();

        // Check most severe first
        if (/major outage|complete outage|service (is |is currently )?down/.test(text)) {
            return { status: { indicator: 'critical', description: 'Major Outage' }, components: [], incidents: [], scheduled_maintenances: [], page: { updated_at: new Date().toISOString() } };
        }
        if (/partial outage/.test(text)) {
            return { status: { indicator: 'major', description: 'Partial Outage' }, components: [], incidents: [], scheduled_maintenances: [], page: { updated_at: new Date().toISOString() } };
        }
        if (/degraded performance|performance issues|elevated error/.test(text)) {
            return { status: { indicator: 'minor', description: 'Degraded Performance' }, components: [], incidents: [], scheduled_maintenances: [], page: { updated_at: new Date().toISOString() } };
        }
        // "investigating" only counts if there's no adjacent "no incidents" text
        if (/investigating/.test(text) && !/no incidents/i.test(text)) {
            return { status: { indicator: 'minor', description: 'Incident Under Investigation' }, components: [], incidents: [], scheduled_maintenances: [], page: { updated_at: new Date().toISOString() } };
        }
        // Default: operational
        return { status: { indicator: 'none', description: 'All Systems Operational' }, components: [], incidents: [], scheduled_maintenances: [], page: { updated_at: new Date().toISOString() } };
    },

    buildStatusCard(svc, data) {
        const indicator = data && data.status ? data.status.indicator : null;
        const desc      = (data && data.status && data.status.description)
                            ? data.status.description
                            : (data ? 'Status available' : 'Could not fetch status');
        const badge     = this.statusBadge(indicator);

        const allComponents = data && Array.isArray(data.components)
            ? data.components.filter(function(c) { return !c.group && c.name; })
            : [];
        const components = allComponents.slice(0, 6);
        const extra      = allComponents.length - components.length;

        const incidents = data && Array.isArray(data.incidents)
            ? data.incidents.filter(function(i) { return i.status !== 'resolved' && i.status !== 'postmortem'; })
            : [];

        const maintenances = data && Array.isArray(data.scheduled_maintenances)
            ? data.scheduled_maintenances.filter(function(m) { return m.status !== 'completed'; })
            : [];

        const updatedAt = (data && data.page && data.page.updated_at) ? this.fmtTime(data.page.updated_at) : '';

        var self = this;
        var parts = [];

        parts.push('<div class="col-md-6">');
        parts.push('<a href="' + svc.statusUrl + '" target="_blank" rel="noopener noreferrer" class="status-service-card">');

        // Header row
        parts.push('<div class="status-card-top">');
        parts.push('<div class="d-flex gap-3 align-items-center">');
        parts.push('<div class="status-service-icon" style="background:' + svc.iconBg + ';color:' + svc.iconColor + ';">');
        parts.push('<i class="bi ' + svc.icon + '"></i></div>');
        parts.push('<div><div class="status-service-name">' + svc.name + '</div>');
        parts.push('<div class="status-service-desc">' + svc.description + '</div></div>');
        parts.push('</div>');
        parts.push('<span class="badge ' + badge.cls + ' px-2 py-1" style="font-size:11px;white-space:nowrap;">');
        parts.push('<i class="bi ' + badge.icon + ' me-1"></i>' + badge.label + '</span>');
        parts.push('</div>');

        // Status description
        parts.push('<div class="status-overall-desc" style="color:' + badge.textColor + ';">' + this.esc(desc) + '</div>');

        // Components
        parts.push('<div class="status-components">');
        if (components.length > 0) {
            for (var ci = 0; ci < components.length; ci++) {
                var c  = components[ci];
                var cs = self.componentStatus(c.status);
                parts.push('<div class="status-component-row">');
                parts.push('<span class="status-component-name">' + self.esc(c.name) + '</span>');
                parts.push('<span class="status-component-dot ' + cs.dotCls + '">');
                parts.push('<i class="bi bi-circle-fill" style="font-size:7px;"></i>' + cs.label + '</span>');
                parts.push('</div>');
            }
            if (extra > 0) {
                parts.push('<div class="text-muted mt-1" style="font-size:12px;">+' + extra + ' more components</div>');
            }
        } else if (data === null) {
            parts.push('<p class="text-muted mb-0" style="font-size:13px;">Status API unreachable \u2014 click to check manually.</p>');
        }
        parts.push('</div>');

        // Active incidents
        if (incidents.length > 0) {
            parts.push('<div class="status-incidents">');
            parts.push('<div class="status-incident-title"><i class="bi bi-exclamation-triangle me-1"></i>Active Incidents</div>');
            var incShow = incidents.slice(0, 3);
            for (var ii = 0; ii < incShow.length; ii++) {
                parts.push('<div class="status-incident-item"><i class="bi bi-dot"></i>' + self.esc(incShow[ii].name));
                parts.push(' <span style="font-size:11px;opacity:.75;">(' + self.esc(incShow[ii].status) + ')</span></div>');
            }
            if (incidents.length > 3) {
                parts.push('<div style="font-size:12px;color:#9a3412;">+' + (incidents.length - 3) + ' more</div>');
            }
            parts.push('</div>');
        }

        // Scheduled maintenance
        if (maintenances.length > 0) {
            parts.push('<div class="status-maintenance">');
            parts.push('<div class="status-maintenance-title"><i class="bi bi-tools me-1"></i>Scheduled Maintenance</div>');
            var mShow = maintenances.slice(0, 2);
            for (var mi = 0; mi < mShow.length; mi++) {
                parts.push('<div class="status-maintenance-item">' + self.esc(mShow[mi].name) + '</div>');
            }
            parts.push('</div>');
        }

        // Footer
        parts.push('<div class="status-card-footer">');
        parts.push('<span>View full status page <i class="bi bi-box-arrow-up-right ms-1"></i></span>');
        if (updatedAt) { parts.push('<span>Updated ' + updatedAt + '</span>'); }
        parts.push('</div>');

        parts.push('</a></div>');
        return parts.join('');
    },

    renderStatusBanner(results) {
        const el = document.getElementById('status-overall-banner');
        if (!el) return;

        const indicators = results.map(r => r?.status?.indicator ?? null);
        let bg, color, icon, text, sub;

        if (indicators.every(i => i === null)) {
            [bg, color, icon, text, sub] = ['#f3f4f6', '#6b7280', 'bi-question-circle-fill',
                'Status Unavailable', '— could not connect to status APIs'];
        } else if (indicators.some(i => i === 'critical')) {
            [bg, color, icon, text, sub] = ['#fee2e2', '#991b1b', 'bi-x-circle-fill',
                'Major Outage Detected', '— one or more services are experiencing a major outage'];
        } else if (indicators.some(i => i === 'major')) {
            [bg, color, icon, text, sub] = ['#ffedd5', '#9a3412', 'bi-exclamation-triangle-fill',
                'Partial Outage', '— one or more services have a partial outage'];
        } else if (indicators.some(i => i === 'minor')) {
            [bg, color, icon, text, sub] = ['#fef3c7', '#92400e', 'bi-exclamation-circle-fill',
                'Degraded Performance', '— one or more services are running with degraded performance'];
        } else {
            [bg, color, icon, text, sub] = ['#d1fae5', '#065f46', 'bi-check-circle-fill',
                'All Systems Operational', '— all monitored services are running normally'];
        }

        el.innerHTML = `
            <div class="status-banner" style="background:${bg};color:${color};">
                <i class="bi ${icon}"></i>
                <div>
                    ${text}<span class="status-banner-sub">${sub}</span>
                </div>
            </div>`;
    },

    statusBadge(indicator) {
        const map = {
            none:     { cls: 'status-badge-ok',          icon: 'bi-check-circle-fill',           label: 'Operational',     textColor: '#065f46' },
            minor:    { cls: 'status-badge-degraded',    icon: 'bi-exclamation-circle-fill',     label: 'Degraded',        textColor: '#92400e' },
            major:    { cls: 'status-badge-partial',     icon: 'bi-exclamation-triangle-fill',   label: 'Partial Outage',  textColor: '#9a3412' },
            critical: { cls: 'status-badge-outage',      icon: 'bi-x-circle-fill',               label: 'Major Outage',    textColor: '#991b1b' }
        };
        return map[indicator] ?? { cls: 'status-badge-unknown', icon: 'bi-question-circle', label: 'Unknown', textColor: '#6b7280' };
    },

    componentStatus(status) {
        const map = {
            operational:          { dotCls: 'dot-ok',          label: 'Operational'  },
            degraded_performance: { dotCls: 'dot-degraded',    label: 'Degraded'     },
            partial_outage:       { dotCls: 'dot-partial',     label: 'Partial Outage'},
            major_outage:         { dotCls: 'dot-outage',      label: 'Major Outage' },
            under_maintenance:    { dotCls: 'dot-maintenance', label: 'Maintenance'  }
        };
        return map[status] ?? { dotCls: 'dot-unknown', label: status || 'Unknown' };
    },

    // ===== OVERVIEW =====

    renderOverview() {
        const submissions = DataStore.getSubmissions();
        const tools   = DataStore.getTools();
        const models  = DataStore.getModels();

        const pending  = submissions.filter(s => s.status === 'pending').length;
        const accepted = submissions.filter(s => s.status === 'accepted').length;
        const deferred = submissions.filter(s => s.status === 'deferred').length;
        const declined = submissions.filter(s => s.status === 'declined').length;

        document.getElementById('stat-tools').textContent    = tools.length;
        document.getElementById('stat-models').textContent   = models.filter(m => m.status === 'active').length;
        document.getElementById('stat-pending').textContent  = pending;
        document.getElementById('stat-accepted').textContent = accepted;
        this.updatePendingBadge(pending);

        const recentEl = document.getElementById('recent-submissions-list');
        if (recentEl) {
            const recent = submissions.slice(0, 5);
            recentEl.innerHTML = recent.length === 0
                ? `<div class="empty-state"><i class="bi bi-inbox"></i><p>No submissions yet.</p></div>`
                : recent.map(s => `
                    <div class="recent-item">
                        <span class="badge badge-status-${s.status} px-2 py-1" style="font-size:11px;text-transform:capitalize;white-space:nowrap;">${s.status}</span>
                        <div class="recent-info">
                            <div class="recent-title">${this.esc(s.title)}</div>
                            <div class="recent-meta">${this.esc(s.name)} &middot; ${this.esc(s.department)} &middot; ${this.fmtDate(s.submittedAt)}</div>
                        </div>
                    </div>`).join('');
        }

        const chartEl = document.getElementById('status-chart');
        if (chartEl) {
            const total = submissions.length || 1;
            if (submissions.length === 0) {
                chartEl.innerHTML = `<div class="empty-state"><i class="bi bi-bar-chart"></i><p>No submissions yet.</p></div>`;
            } else {
                const bars = [
                    { label: 'Pending',  count: pending,  color: '#f59e0b' },
                    { label: 'Accepted', count: accepted, color: '#10b981' },
                    { label: 'Deferred', count: deferred, color: '#3b82f6' },
                    { label: 'Declined', count: declined, color: '#ef4444' }
                ];
                chartEl.innerHTML = bars.map(b => `
                    <div class="status-bar">
                        <div class="status-bar-label"><span>${b.label}</span><span>${b.count}</span></div>
                        <div class="status-bar-track">
                            <div class="status-bar-fill" style="width:${(b.count / total * 100).toFixed(1)}%;background:${b.color};"></div>
                        </div>
                    </div>`).join('');
            }
        }
    },

    // ===== TOOLS =====

    renderTools() {
        const tools = DataStore.getTools();
        const categories = [...new Set(tools.map(t => t.category))];
        const filterEl = document.getElementById('tools-filter-buttons');

        if (filterEl) {
            filterEl.innerHTML = [
                `<button class="btn btn-sm btn-primary filter-btn active" data-filter="all">All (${tools.length})</button>`,
                ...categories.map(c =>
                    `<button class="btn btn-sm btn-outline-secondary filter-btn" data-filter="${this.esc(c)}">${this.esc(c)} (${tools.filter(t => t.category === c).length})</button>`
                )
            ].join('');

            filterEl.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    filterEl.querySelectorAll('.filter-btn').forEach(b => {
                        b.classList.replace('btn-primary', 'btn-outline-secondary');
                        b.classList.remove('active');
                    });
                    btn.classList.replace('btn-outline-secondary', 'btn-primary');
                    btn.classList.add('active');
                    const search = document.getElementById('tools-search')?.value || '';
                    this.renderToolsGrid(btn.dataset.filter, search);
                });
            });
        }

        const searchInput = document.getElementById('tools-search');
        if (searchInput) {
            searchInput.value = '';
            const fresh = searchInput.cloneNode(true);
            searchInput.parentNode.replaceChild(fresh, searchInput);
            fresh.addEventListener('input', () => {
                const active = filterEl?.querySelector('.filter-btn.active')?.dataset.filter || 'all';
                this.renderToolsGrid(active, fresh.value);
            });
        }

        this.renderToolsGrid('all', '');
    },

    renderToolsGrid(category, search) {
        let tools = DataStore.getTools();
        if (category !== 'all') tools = tools.filter(t => t.category === category);
        if (search.trim()) {
            const q = search.toLowerCase();
            tools = tools.filter(t =>
                t.name.toLowerCase().includes(q) ||
                t.description.toLowerCase().includes(q) ||
                t.category.toLowerCase().includes(q)
            );
        }

        const grid = document.getElementById('tools-grid');
        if (!grid) return;

        if (tools.length === 0) {
            grid.innerHTML = `<div class="col-12"><div class="empty-state"><i class="bi bi-search"></i><p>No tools match your search.</p></div></div>`;
            return;
        }

        grid.innerHTML = tools.map(t => `
            <div class="col-md-6 col-xl-4">
                <div class="tool-card">
                    <div class="tool-card-header">
                        <div class="tool-icon" style="background:${t.iconBg};color:${t.iconColor};">
                            <i class="bi ${t.icon}"></i>
                        </div>
                        <span class="badge bg-light text-secondary border" style="font-size:11px;">${this.esc(t.category)}</span>
                    </div>
                    <div class="tool-name">${this.esc(t.name)}</div>
                    <div class="tool-description mt-1">${this.esc(t.description)}</div>
                    <div class="mt-2">
                        <span class="badge" style="background:#d1fae5;color:#065f46;font-size:11px;">
                            <i class="bi bi-check-circle me-1"></i>Approved ${this.fmtDateShort(t.approvedDate)}
                        </span>
                    </div>
                    ${t.guidelines ? `<div class="tool-guidelines"><i class="bi bi-info-circle me-1"></i>${this.esc(t.guidelines)}</div>` : ''}
                    <a href="${t.url}" target="_blank" rel="noopener noreferrer" class="tool-link-btn">
                        <i class="bi bi-box-arrow-up-right"></i>Open ${this.esc(t.name)}
                    </a>
                </div>
            </div>`).join('');
    },

    // ===== MODELS =====

    renderModels() {
        const models = DataStore.getModels();

        const statusMeta = {
            active:     { label: 'Active',       color: 'success',   icon: 'bi-check-circle-fill' },
            restricted: { label: 'Restricted',   color: 'warning',   icon: 'bi-exclamation-circle-fill' },
            review:     { label: 'Under Review', color: 'info',      icon: 'bi-clock-fill' },
            deprecated: { label: 'Deprecated',   color: 'secondary', icon: 'bi-x-circle-fill' }
        };

        const summaryEl = document.getElementById('model-status-summary');
        if (summaryEl) {
            summaryEl.innerHTML = Object.entries(statusMeta).map(([status, meta]) => {
                const count = models.filter(m => m.status === status).length;
                return `
                    <div class="col-6 col-md-3">
                        <div class="card text-center py-3">
                            <div class="card-body p-2">
                                <div class="fs-1 text-${meta.color} mb-1"><i class="bi ${meta.icon}"></i></div>
                                <div class="fs-3 fw-bold">${count}</div>
                                <div class="text-muted small">${meta.label}</div>
                            </div>
                        </div>
                    </div>`;
            }).join('');
        }

        const badgeClass = { active: 'badge-model-active', restricted: 'badge-model-restricted', review: 'badge-model-review', deprecated: 'badge-model-deprecated' };
        const badgeLabel = { active: 'Active', restricted: 'Restricted', review: 'Under Review', deprecated: 'Deprecated' };
        const badgeIcon  = { active: 'bi-check-circle-fill', restricted: 'bi-exclamation-circle-fill', review: 'bi-clock-fill', deprecated: 'bi-x-circle-fill' };

        const listEl = document.getElementById('models-list');
        if (!listEl) return;

        listEl.innerHTML = models.map(m => `
            <div class="col-md-6 col-xl-4">
                <div class="model-card">
                    <div class="model-header">
                        <div>
                            <div class="model-name">${this.esc(m.name)}</div>
                            <div class="model-provider"><i class="bi bi-building me-1"></i>${this.esc(m.provider)}</div>
                        </div>
                        <span class="badge px-2 py-1 ${badgeClass[m.status] || ''}">
                            <i class="bi ${badgeIcon[m.status] || 'bi-circle'} me-1"></i>${badgeLabel[m.status] || m.status}
                        </span>
                    </div>
                    <p class="text-muted mb-2" style="font-size:13px;">${this.esc(m.description)}</p>
                    <div class="model-uses-title">Approved Uses</div>
                    ${m.approvedUses.map(u => `<div class="model-use-item"><i class="bi bi-check-lg"></i>${this.esc(u)}</div>`).join('')}
                    ${m.restrictions ? `
                        <div class="model-restrictions">
                            <i class="bi bi-shield-exclamation me-1"></i><strong>Restrictions:</strong> ${this.esc(m.restrictions)}
                        </div>` : ''}
                    <div class="model-meta-row mt-2"><i class="bi bi-database"></i><span>${this.esc(m.dataClassification)}</span></div>
                    ${m.approvedDate ? `
                        <div class="model-meta-row">
                            <i class="bi bi-calendar-check"></i><span>Approved ${this.fmtDateShort(m.approvedDate)}</span>
                        </div>` : ''}
                </div>
            </div>`).join('');
    },

    // ===== SUBMIT =====

    renderSubmit() {
        document.getElementById('submit-success')?.classList.add('d-none');
        document.getElementById('submit-form-card')?.classList.remove('d-none');
    },

    setupSubmitForm() {
        const form = document.getElementById('idea-form');
        if (!form) return;

        form.addEventListener('submit', e => {
            e.preventDefault();
            if (!form.checkValidity()) { form.classList.add('was-validated'); return; }

            const val = id => document.getElementById(id)?.value.trim() || '';

            DataStore.addSubmission({
                id:           DataStore.generateId(),
                title:        val('field-title'),
                name:         val('field-name'),
                email:        val('field-email'),
                department:   val('field-department'),
                role:         val('field-role'),
                problem:      val('field-problem'),
                solution:     val('field-solution'),
                benefits:     val('field-benefits'),
                tools:        val('field-tools'),
                effort:       val('field-effort'),
                dataConcerns: val('field-data'),
                status:       'pending',
                submittedAt:  new Date().toISOString(),
                reviewNotes:  '',
                reviewedBy:   '',
                reviewedAt:   null
            });

            form.reset();
            form.classList.remove('was-validated');
            document.getElementById('submit-success')?.classList.remove('d-none');
            document.getElementById('submit-form-card')?.classList.add('d-none');
            this.updatePendingBadge();
        });

        document.getElementById('submit-another-btn')?.addEventListener('click', () => {
            document.getElementById('submit-success')?.classList.add('d-none');
            document.getElementById('submit-form-card')?.classList.remove('d-none');
        });
    },

    // ===== COMMITTEE =====

    setupCommitteeAuth() {
        const passwordInput = document.getElementById('committee-password');
        const errorEl       = document.getElementById('password-error');

        const tryLogin = () => {
            if (passwordInput?.value === this.COMMITTEE_PASSWORD) {
                this.isAuthenticated = true;
                document.getElementById('committee-gate').classList.add('d-none');
                document.getElementById('committee-dashboard').classList.remove('d-none');
                this.renderCommitteeSubmissions('pending');
            } else {
                errorEl?.classList.remove('d-none');
                if (passwordInput) { passwordInput.value = ''; passwordInput.focus(); }
            }
        };

        document.getElementById('committee-login-btn')?.addEventListener('click', tryLogin);
        passwordInput?.addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });
        passwordInput?.addEventListener('input', () => errorEl?.classList.add('d-none'));

        document.getElementById('committee-logout-btn')?.addEventListener('click', () => {
            this.isAuthenticated = false;
            document.getElementById('committee-gate').classList.remove('d-none');
            document.getElementById('committee-dashboard').classList.add('d-none');
            if (passwordInput) passwordInput.value = '';
            errorEl?.classList.add('d-none');
        });
    },

    setupCommitteeTabs() {
        document.getElementById('committee-tabs')?.querySelectorAll('a[data-filter]').forEach(tab => {
            tab.addEventListener('click', e => {
                e.preventDefault();
                document.getElementById('committee-tabs').querySelectorAll('a').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentFilter = tab.dataset.filter;
                this.renderCommitteeSubmissions(tab.dataset.filter);
            });
        });
    },

    renderCommittee() {
        this.updateTabCounts();
        if (this.isAuthenticated) this.renderCommitteeSubmissions(this.currentFilter);
    },

    updateTabCounts() {
        const subs = DataStore.getSubmissions();
        const counts = {
            pending:  subs.filter(s => s.status === 'pending').length,
            accepted: subs.filter(s => s.status === 'accepted').length,
            deferred: subs.filter(s => s.status === 'deferred').length,
            declined: subs.filter(s => s.status === 'declined').length,
            all:      subs.length
        };
        Object.entries(counts).forEach(([k, v]) => {
            const el = document.getElementById(`tab-count-${k}`);
            if (el) el.textContent = v;
        });
        this.updatePendingBadge(counts.pending);
    },

    updatePendingBadge(count) {
        if (count === undefined) count = DataStore.getSubmissions().filter(s => s.status === 'pending').length;
        const badge = document.getElementById('pending-badge');
        if (badge) { badge.textContent = count; badge.style.display = count > 0 ? '' : 'none'; }
    },

    renderCommitteeSubmissions(filter) {
        this.updateTabCounts();
        let subs = DataStore.getSubmissions();
        if (filter !== 'all') subs = subs.filter(s => s.status === filter);

        const listEl = document.getElementById('committee-submissions-list');
        if (!listEl) return;

        if (subs.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-inbox"></i>
                    <p>No ${filter === 'all' ? '' : filter + ' '}submissions.</p>
                    ${filter === 'pending' ? `<a href="#" class="btn btn-outline-primary btn-sm mt-2" data-nav="submit">Encourage submissions</a>` : ''}
                </div>`;
            listEl.querySelectorAll('[data-nav]').forEach(el => {
                el.addEventListener('click', e => { e.preventDefault(); this.navigate(el.dataset.nav); });
            });
            return;
        }

        const effortLabel = { low: 'Low effort', medium: 'Medium effort', high: 'High effort' };

        listEl.innerHTML = subs.map(s => `
            <div class="committee-card">
                <div class="submission-card-header">
                    <div class="submission-title-row">
                        <div class="submission-title">${this.esc(s.title)}</div>
                        <div class="submission-meta">
                            <span><i class="bi bi-person me-1"></i>${this.esc(s.name)}</span>
                            <span><i class="bi bi-building me-1"></i>${this.esc(s.department)}</span>
                            <span><i class="bi bi-calendar3 me-1"></i>${this.fmtDate(s.submittedAt)}</span>
                            ${s.effort ? `<span><i class="bi bi-lightning me-1"></i>${effortLabel[s.effort] || s.effort}</span>` : ''}
                        </div>
                    </div>
                    <span class="badge badge-status-${s.status} px-2 py-1" style="font-size:12px;text-transform:capitalize;white-space:nowrap;">${s.status}</span>
                </div>
                <div class="submission-card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="submission-field">
                                <div class="submission-field-label">Problem Statement</div>
                                <div class="submission-field-value">${this.esc(s.problem)}</div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="submission-field">
                                <div class="submission-field-label">Proposed AI Solution</div>
                                <div class="submission-field-value">${this.esc(s.solution)}</div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="submission-field">
                                <div class="submission-field-label">Expected Benefits</div>
                                <div class="submission-field-value">${this.esc(s.benefits)}</div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="submission-field">
                                <div class="submission-field-label">Suggested Tools / Models</div>
                                <div class="submission-field-value">${this.esc(s.tools || '—')}</div>
                            </div>
                        </div>
                        ${s.dataConcerns ? `
                            <div class="col-12">
                                <div class="submission-field">
                                    <div class="submission-field-label">Data / Privacy Considerations</div>
                                    <div class="submission-field-value">${this.esc(s.dataConcerns)}</div>
                                </div>
                            </div>` : ''}
                    </div>
                </div>
                ${s.reviewNotes ? `
                    <div class="review-result-note">
                        <i class="bi bi-chat-quote me-1"></i>
                        <strong>Committee Notes:</strong> ${this.esc(s.reviewNotes)}
                        ${s.reviewedBy ? `<span class="text-muted ms-2">— ${this.esc(s.reviewedBy)}, ${this.fmtDate(s.reviewedAt)}</span>` : ''}
                    </div>` : ''}
                <div class="submission-actions">
                    ${s.status !== 'accepted' ? `<button class="btn btn-sm btn-success" onclick="App.openReviewModal('${s.id}','accepted')"><i class="bi bi-check-lg me-1"></i>Accept</button>` : ''}
                    ${s.status !== 'deferred' ? `<button class="btn btn-sm btn-info text-white" onclick="App.openReviewModal('${s.id}','deferred')"><i class="bi bi-clock me-1"></i>Defer</button>` : ''}
                    ${s.status !== 'declined' ? `<button class="btn btn-sm btn-danger" onclick="App.openReviewModal('${s.id}','declined')"><i class="bi bi-x-lg me-1"></i>Decline</button>` : ''}
                    ${s.status !== 'pending'  ? `<button class="btn btn-sm btn-outline-secondary" onclick="App.openReviewModal('${s.id}','pending')"><i class="bi bi-arrow-counterclockwise me-1"></i>Reset</button>` : ''}
                </div>
            </div>`).join('');
    },

    openReviewModal(submissionId, action) {
        const submission = DataStore.getSubmission(submissionId);
        if (!submission) return;

        const config = {
            accepted: { title: 'Accept Submission',  btnClass: 'btn-success',         btnText: 'Confirm Accept',  notesLabel: 'Acceptance Notes / Next Steps' },
            deferred: { title: 'Defer Submission',   btnClass: 'btn-info text-white', btnText: 'Confirm Defer',   notesLabel: 'Reason for Deferral' },
            declined: { title: 'Decline Submission', btnClass: 'btn-danger',          btnText: 'Confirm Decline', notesLabel: 'Reason for Declining' },
            pending:  { title: 'Reset to Pending',   btnClass: 'btn-secondary',       btnText: 'Confirm Reset',   notesLabel: 'Notes (optional)' }
        }[action] || {};

        document.getElementById('reviewModalTitle').textContent          = config.title;
        document.getElementById('review-submission-title').textContent   = submission.title;
        document.getElementById('review-notes-label').textContent        = config.notesLabel;
        document.getElementById('review-notes').value                    = '';
        document.getElementById('reviewer-name').value                   = '';
        document.getElementById('reviewer-name').classList.remove('is-invalid');

        const confirmBtn = document.getElementById('review-confirm-btn');
        confirmBtn.className = `btn ${config.btnClass}`;
        confirmBtn.textContent = config.btnText;

        const fresh = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(fresh, confirmBtn);

        fresh.addEventListener('click', () => {
            const reviewerName = document.getElementById('reviewer-name').value.trim();
            if (!reviewerName) { document.getElementById('reviewer-name').classList.add('is-invalid'); return; }
            document.getElementById('reviewer-name').classList.remove('is-invalid');

            DataStore.updateSubmission(submissionId, {
                status:      action,
                reviewNotes: document.getElementById('review-notes').value.trim(),
                reviewedBy:  reviewerName,
                reviewedAt:  new Date().toISOString()
            });

            bootstrap.Modal.getInstance(document.getElementById('reviewModal')).hide();
            this.renderCommitteeSubmissions(this.currentFilter);
        });

        new bootstrap.Modal(document.getElementById('reviewModal')).show();
    },

    // ===== UTILITIES =====

    esc(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    },

    fmtDate(iso) {
        if (!iso) return '—';
        try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
        catch { return iso; }
    },

    fmtDateShort(str) {
        if (!str) return '';
        try { return new Date(str).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); }
        catch { return str; }
    },

    fmtTime(iso) {
        if (!iso) return '';
        try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
        catch { return ''; }
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
