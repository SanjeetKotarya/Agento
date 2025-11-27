// Tab Management
let tabs = [
    { id: 'tab-1', title: 'LinkedIn Profile', image: 'images/profile.png', active: true, type: 'web' }
];
let tabCounter = 1;

// Analytics Data (mock)
let analyticsData = {
    profilesScanned: 24,
    emailsSent: 18,
    successRate: 75,
    timeSavedHours: 3.5,
    interventionRate: 12,
    interventionBreakdown: [
        { label: 'Fully Automated', value: 80, color: '#4f8bf9' },
        { label: 'Draft Editing', value: 15, color: '#f57c00' },
        { label: 'Contact Search', value: 5, color: '#d84315' }
    ],
    funnel: [
        { stage: 'Profiles Scanned', count: 24 },
        { stage: 'Qualified Matches', count: 20 },
        { stage: 'Emails Found', count: 19 },
        { stage: 'Emails Sent', count: 18 }
    ],
    activities: [
        { time: '09:15 AM', profile: 'John Doe', action: 'Profile Scanned', outcome: 'N/A', status: 'success', quality: 'high' },
        { time: '09:22 AM', profile: 'Yash Pundlik', action: 'Email Sent', outcome: 'Success - Reply Received', status: 'success', quality: 'high' },
        { time: '09:30 AM', profile: 'Bob Johnson', action: 'Drafted Email', outcome: 'Edited by Human', status: 'pending', quality: 'med' },
        { time: '09:35 AM', profile: 'Alice Brown', action: 'Email Sent', outcome: 'Success - Drafted', status: 'success', quality: 'high' },
        { time: '09:42 AM', profile: 'Charlie Wilson', action: 'Contact Search', outcome: 'Manual Add', status: 'error', quality: 'low' },
    ]
};

let composerAttachments = [];

const workflowState = {
    currentStep: 0,
    selectedRole: 'Senior UX Designer',
    tone: 'casual'
};

let workflowToastTimeout = null;
let jdProgressTimeout = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    initializeCharts();
    updateAnalytics();
    initializeTabs();
    initializeWorkflow();
    setupComposerInput();
    setupDarkMode();
});

function initializeTabs() {
    updateTabs();
    switchTab('tab-1');
}

function setupEventListeners() {
    // New tab button
    document.getElementById('newTabBtn').addEventListener('click', createNewTab);
    
    // Tab switching
    document.addEventListener('click', (e) => {
        if (e.target.closest('.tab') && !e.target.closest('.tab-close')) {
            const tabId = e.target.closest('.tab').dataset.tabId;
            switchTab(tabId);
        }
    });
    
    // Toolbar buttons
    document.getElementById('aiAssistantBtn').addEventListener('click', toggleWorkflowPanel);
    document.getElementById('analyticsBtn').addEventListener('click', toggleAnalytics);
    
    setupMenuDropdown();
    // Role filter change
    const roleFilter = document.getElementById('roleFilter');
    if (roleFilter) {
        roleFilter.addEventListener('change', (e) => {
            const role = e.target.value;
            showWorkflowToast('Filtering analytics: ' + role);
            // In this mock, we don't change underlying numbers, but redraw charts
            drawFunnelChart();
            drawInterventionChart();
        });
    }
    
    // Sidebar resize logic: add a draggable handle on the left edge
    const overlay = document.getElementById('webViewOverlay');
    const handle = document.getElementById('sidebarResizeHandle');
    if (overlay && handle) {
        let isResizing = false;
        const container = document.querySelector('.content-area');
        const minWidth = 260;

        handle.addEventListener('dblclick', () => {
            // reset to default width
            overlay.style.width = '';
            overlay.style.flex = '';
            overlay.classList.add('active');
        });

        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            overlay.style.transition = 'none';
            document.body.style.cursor = 'col-resize';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const rect = container.getBoundingClientRect();
            let newWidth = Math.max(minWidth, Math.min(rect.width - 120, rect.right - e.clientX));
            overlay.style.width = newWidth + 'px';
            overlay.style.flex = '0 0 ' + newWidth + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (!isResizing) return;
            isResizing = false;
            overlay.style.transition = '';
            document.body.style.cursor = '';
        });

        // touch support
        handle.addEventListener('touchstart', (e) => {
            isResizing = true;
            overlay.style.transition = 'none';
            document.body.style.cursor = 'col-resize';
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (!isResizing) return;
            const touch = e.touches[0];
            const rect = container.getBoundingClientRect();
            let newWidth = Math.max(minWidth, Math.min(rect.width - 120, rect.right - touch.clientX));
            overlay.style.width = newWidth + 'px';
            overlay.style.flex = '0 0 ' + newWidth + 'px';
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('touchend', () => {
            if (!isResizing) return;
            isResizing = false;
            overlay.style.transition = '';
            document.body.style.cursor = '';
        });
    }
}

function setupMenuDropdown() {
    const menuBtn = document.getElementById('menuBtn');
    const menuDropdown = document.getElementById('menuDropdown');
    
    if (!menuBtn || !menuDropdown) return;
    
    menuBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        const isOpen = menuDropdown.classList.toggle('open');
        menuBtn.classList.toggle('active', isOpen);
    });
    
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.menu-wrapper')) {
            menuDropdown.classList.remove('open');
            menuBtn.classList.remove('active');
        }
    });
}

// Tab Management Functions
function createNewTab() {
    tabCounter++;
    const newTab = {
        id: `tab-${tabCounter}`,
        title: 'Google',
        image: 'images/google.png',
        active: false,
        type: 'web'
    };
    
    tabs.forEach(tab => tab.active = false);
    tabs.push(newTab);
    newTab.active = true;
    
    // Create web view container for new tab
    const contentArea = document.querySelector('.content-area');
    const overlay = document.getElementById('webViewOverlay');
    const webView = document.createElement('div');
    webView.className = 'web-view-container';
    webView.id = `webView-${newTab.id}`;
    webView.dataset.tabId = newTab.id;
    const img = document.createElement('img');
    img.src = newTab.image;
    img.alt = newTab.title;
    img.onerror = () => {
        console.warn(`Image ${newTab.image} not found.`);
        img.style.display = 'none';
    };
    webView.appendChild(img);
    if (contentArea) {
        if (overlay && contentArea.contains(overlay)) {
            contentArea.insertBefore(webView, overlay);
        } else {
            contentArea.appendChild(webView);
        }
    }
    
    updateTabs();
    switchTab(newTab.id);
}

function closeTab(event, tabId) {
    event.stopPropagation();
    removeTabById(tabId);
}

function removeTabById(tabId) {
    if (tabs.length === 1) {
        // Don't close the last tab
        return;
    }
    
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;
    
    const wasActive = tabs[tabIndex].active;
    tabs.splice(tabIndex, 1);
    
    // Remove web view container if it exists
    const webView = document.getElementById(`webView-${tabId}`);
    if (webView) {
        webView.remove();
    }
    
    if (tabs.length === 0) {
        updateTabs();
        return;
    }
    
    if (!tabs.some(t => t.active)) {
        tabs[0].active = true;
    }
    
    if (wasActive) {
        switchTab(tabs.find(t => t.active).id);
    } else {
        updateTabs();
    }
}

function switchTab(tabId) {
    tabs.forEach(tab => tab.active = tab.id === tabId);
    
    const activeTab = tabs.find(t => t.id === tabId);
    if (!activeTab) return;
    
    // Update address bar
    const addressInput = document.getElementById('addressInput');
    if (activeTab.type === 'analytics') {
        addressInput.value = 'agento://analytics/dashboard';
    } else if (activeTab.title === 'LinkedIn Profile') {
        addressInput.value = 'linkedin.com/in/profile';
    } else if (activeTab.title === 'Google') {
        addressInput.value = 'google.com';
    } else {
        addressInput.value = activeTab.title.toLowerCase().replace(/\s+/g, '') + '.com';
    }
    
    // Hide all views
    document.querySelectorAll('.web-view-container').forEach(view => {
        view.classList.remove('active');
    });
    const analyticsView = document.getElementById('analyticsView');
    if (analyticsView) {
        analyticsView.style.display = 'none';
    }
    
    // Show appropriate view based on tab type
    if (activeTab.type === 'analytics') {
        // Show analytics view
        if (analyticsView) {
            analyticsView.style.display = 'block';
        }
        document.getElementById('analyticsBtn').classList.add('active');
        // Redraw charts once analytics view is visible
        requestAnimationFrame(() => {
            initializeCharts();
            updateAnalytics();
        });
    } else {
        // Show web view
        const activeView = document.getElementById(`webView-${tabId}`);
        if (activeView) {
            activeView.classList.add('active');
        } else {
            // Create if doesn't exist
            if (activeTab.image) {
                const contentArea = document.querySelector('.content-area');
                const overlay = document.getElementById('webViewOverlay');
                const webView = document.createElement('div');
                webView.className = 'web-view-container active';
                webView.id = `webView-${activeTab.id}`;
                webView.dataset.tabId = activeTab.id;
                const img = document.createElement('img');
                img.src = activeTab.image;
                img.alt = activeTab.title;
                img.onerror = () => {
                    console.warn(`Image ${activeTab.image} not found.`);
                    img.style.display = 'none';
                };
                webView.appendChild(img);
                if (contentArea) {
                    if (overlay && contentArea.contains(overlay)) {
                        contentArea.insertBefore(webView, overlay);
                    } else {
                        contentArea.appendChild(webView);
                    }
                }
            }
        }
        document.getElementById('analyticsBtn').classList.remove('active');
    }
    
    updateTabs();
}

function updateTabs() {
    const tabsContainer = document.getElementById('tabsContainer');
    tabsContainer.innerHTML = '';
    
    tabs.forEach(tab => {
        const tabElement = document.createElement('div');
        tabElement.className = `tab ${tab.active ? 'active' : ''}`;
        tabElement.dataset.tabId = tab.id;
        
        // Choose icon based on tab type
        let iconSvg = '';
        if (tab.type === 'analytics') {
            iconSvg = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="20" x2="18" y2="10"/>
                    <line x1="12" y1="20" x2="12" y2="4"/>
                    <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
            `;
        } else {
            iconSvg = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10"/>
                </svg>
            `;
        }
        
        tabElement.innerHTML = `
            <div class="tab-icon">
                ${iconSvg}
            </div>
            <span class="tab-title">${tab.title}</span>
            <button class="tab-close" onclick="closeTab(event, '${tab.id}')">×</button>
        `;
        
        tabsContainer.appendChild(tabElement);
    });
}

// LinkedIn Workflow
function toggleWorkflowPanel() {
    const overlay = document.getElementById('webViewOverlay');
    const btn = document.getElementById('aiAssistantBtn');
    // toggle and determine current active state
    const isActive = overlay.classList.toggle('active');
    if (btn) btn.classList.toggle('active', isActive);
    // show or hide the suggestion bubble when sidebar opens/closes
    showSuggestionBubble(isActive);
    // if the sidebar is being closed and there are no chats, ensure welcome card is visible
    if (!isActive) {
        const welcomeCard = document.querySelector('.welcome-card');
        if (welcomeCard) welcomeCard.classList.remove('hidden');
    }
}



// Show or hide the suggestion bubble that pops out near the footer input
function showSuggestionBubble(show) {
    const btn = document.querySelector('.suggestion-btn');
    if (!btn) return;

    if (show) {
        // ensure visible and animate
        btn.classList.remove('bubble-hidden');
        btn.style.display = 'inline-flex';
        // force reflow then add visible class to trigger animation
        void btn.offsetWidth;
        btn.classList.add('bubble-visible');
        // remove any leftover hidden state
        setTimeout(() => btn.classList.remove('bubble-hidden'), 400);
    } else {
        // fade out then hide
        btn.classList.remove('bubble-visible');
        btn.classList.add('bubble-hidden');
        setTimeout(() => {
            btn.style.display = 'none';
        }, 320);
    }
}

function initializeWorkflow() {
    const scanPageBtn = document.getElementById('scanPageBtn');
    const roleSelect = document.getElementById('roleSelect');
    const startButton = document.getElementById('startScreeningBtn');
    const draftEmailChip = document.getElementById('draftEmailChip');
    const checkGithubBtn = document.getElementById('checkGithubBtn');
    const regenerateBtn = document.getElementById('regenerateDraftBtn');
    const openGmailBtn = document.getElementById('openGmailBtn');
    const uploadJdBtn = document.getElementById('uploadJdBtn');
    const clearChatBtn = document.getElementById('clearChatBtn');

    if (scanPageBtn) {
        scanPageBtn.addEventListener('click', (e) => {
            // hide the suggestion bubble when user clicks
            showSuggestionBubble(false);
            setWorkflowStep(1);
        });
    }

    if (roleSelect && startButton) {
        startButton.addEventListener('click', () => {
            workflowState.selectedRole = roleSelect.value;
            updateSelectedRoleText();
            setWorkflowStep(2);
        });
    }

    if (uploadJdBtn) {
        uploadJdBtn.addEventListener('click', () => {
            uploadJdBtn.style.display = 'none';
            startJdProcessing();
        });
    }

    if (draftEmailChip) {
        draftEmailChip.addEventListener('click', () => {
            setWorkflowStep(3);
        });
    }

    if (checkGithubBtn) {
        checkGithubBtn.addEventListener('click', () => {
            showWorkflowToast('Checking GitHub...');
            console.log('Checking GitHub...');
        });
    }

    if (regenerateBtn) {
        regenerateBtn.addEventListener('click', regenerateDraft);
    }

    if (openGmailBtn) {
        openGmailBtn.addEventListener('click', () => {
            openGmailComposer();
        });
    }

    if (clearChatBtn) {
        clearChatBtn.addEventListener('click', resetWorkflow);
    }

    document.querySelectorAll('.tone-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            document.querySelectorAll('.tone-toggle').forEach(btn => btn.classList.remove('active'));
            toggle.classList.add('active');
            workflowState.tone = toggle.dataset.tone || 'casual';
            regenerateDraft();
        });
    });

    setWorkflowStep(0);
    updateSelectedRoleText();
    regenerateDraft();
}

function setupComposerInput() {
    const textarea = document.getElementById('footerComposer');
    const attachmentBtn = document.getElementById('attachmentBtn');
    const attachmentInput = document.getElementById('attachmentInput');
    const attachmentPreview = document.getElementById('attachmentPreview');

    if (textarea) {
        const autoResize = () => {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 40) + 'px';
        };
        textarea.addEventListener('input', autoResize);
        autoResize();
    }

    const renderAttachmentPreview = () => {
        if (!attachmentPreview) return;
        attachmentPreview.innerHTML = '';

        composerAttachments.forEach(item => {
            const chip = document.createElement('div');
            chip.className = `attachment-chip ${item.type}`;

            if (item.type === 'image') {
                const img = document.createElement('img');
                img.src = item.data;
                img.alt = item.name;
                chip.appendChild(img);
            } else {
                chip.textContent = formatAttachmentName(item.name);
                chip.title = item.name;
            }

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-attachment';
            removeBtn.type = 'button';
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', () => {
                composerAttachments = composerAttachments.filter(att => att.id !== item.id);
                renderAttachmentPreview();
            });

            chip.appendChild(removeBtn);
            attachmentPreview.appendChild(chip);
        });
    };

    if (attachmentBtn && attachmentInput) {
        attachmentBtn.addEventListener('click', () => {
            attachmentInput.value = '';
            attachmentInput.click();
        });

        attachmentInput.addEventListener('change', () => {
            const files = Array.from(attachmentInput.files || []);
            if (!files.length) return;

            files.forEach(file => {
                const id = `att-${Date.now()}-${Math.random().toString(16).slice(2)}`;
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        composerAttachments.push({
                            id,
                            type: 'image',
                            data: event.target.result,
                            name: file.name
                        });
                        renderAttachmentPreview();
                    };
                    reader.readAsDataURL(file);
                } else {
                    composerAttachments.push({
                        id,
                        type: 'doc',
                        name: file.name
                    });
                    renderAttachmentPreview();
                }
            });
        });
    }

    renderAttachmentPreview();

    // Send message from footer composer when send button clicked or Enter pressed
    const sendBtn = document.querySelector('.footer-send-btn');
    const composer = document.getElementById('footerComposer');
    function sendComposerMessage() {
        if (!composer) return;
        const text = composer.value.trim();
        if (!text) return;

        // ensure sidebar is visible
        const overlay = document.getElementById('webViewOverlay');
        const aiBtn = document.getElementById('aiAssistantBtn');
        if (overlay && !overlay.classList.contains('active')) {
            overlay.classList.add('active');
            if (aiBtn) aiBtn.classList.add('active');
        }

        // find the last visible workflow step's chat thread
        const visibleSteps = Array.from(document.querySelectorAll('.workflow-step')).filter(s => !s.classList.contains('hidden'));
        let targetStep = visibleSteps.length ? visibleSteps[visibleSteps.length - 1] : document.getElementById('step0');
        if (!targetStep) targetStep = document.querySelector('.workflow-step');
        let chatThread = targetStep ? targetStep.querySelector('.chat-thread') : null;
        if (!chatThread) {
            chatThread = document.createElement('div');
            chatThread.className = 'chat-thread';
            // Append the chat thread inside the current step so messages flow downward
            if (targetStep) {
                targetStep.appendChild(chatThread);
            } else {
                const panel = document.querySelector('.workflow-content');
                if (panel) panel.appendChild(chatThread);
            }
        }

        // create user bubble
        const userBubble = document.createElement('div');
        userBubble.className = 'chat-bubble user';
        userBubble.textContent = text;
        chatThread.appendChild(userBubble);
        chatThread.scrollIntoView({ behavior: 'smooth', block: 'end' });

        // hide welcome card once user starts chatting
        const welcomeCard = document.querySelector('.welcome-card');
        if (welcomeCard && !welcomeCard.classList.contains('hidden')) {
            welcomeCard.classList.add('hidden');
        }

        // clear composer
        composer.value = '';
        composer.style.height = 'auto';

        // AI reply (mock)
        setTimeout(() => {
            const aiBubble = document.createElement('div');
            aiBubble.className = 'chat-bubble ai';
            aiBubble.textContent = 'Sorry i am not a real chat bot';
            chatThread.appendChild(aiBubble);
            chatThread.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 600);
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sendComposerMessage();
        });
    }

    if (composer) {
        composer.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendComposerMessage();
            }
        });
    }
}

function formatAttachmentName(name) {
    if (!name) return '';
    const dotIndex = name.lastIndexOf('.');
    let base = name;
    let ext = '';
    if (dotIndex > 0) {
        base = name.slice(0, dotIndex);
        ext = name.slice(dotIndex + 1);
    }
    const truncated = base.length > 3 ? base.slice(0, 3) + '...' : base + '...';
    return ext ? `${truncated}${ext}` : truncated;
}

function updateSelectedRoleText() {
    const roleStatement = document.getElementById('selectedRoleText');
    const roleSummary = document.getElementById('selectedRoleSummary');
    const role = workflowState.selectedRole;

    if (roleStatement) {
        roleStatement.textContent = `Let's screen for ${role}.`;
    }
    if (roleSummary) {
        roleSummary.textContent = role;
    }
}

function setWorkflowStep(step) {
    workflowState.currentStep = step;
    document.querySelectorAll('.workflow-step').forEach(section => {
        const sectionStep = Number(section.dataset.step);
        // Keep steps cumulative for steps >= 1 (show all previous steps),
        // but treat step-0 as the intro/welcome which should only be
        // visible when current step is 0.
        let shouldShow;
        if (sectionStep === 0) {
            shouldShow = (step === 0);
        } else {
            shouldShow = sectionStep <= step;
        }
        if (shouldShow) {
            section.classList.remove('hidden');
            section.style.setProperty('--step-delay', `${Math.max(sectionStep - 1, 0) * 80}ms`);
            if (!section.classList.contains('visible')) {
                requestAnimationFrame(() => {
                    section.classList.add('visible');
                    section.dataset.shown = 'true';
                    if (sectionStep === step) {
                        setTimeout(() => scrollWorkflowToSection(section), 130);
                    }
                });
            } else if (sectionStep === step) {
                scrollWorkflowToSection(section);
            }
        } else {
            section.classList.add('hidden');
            section.classList.remove('visible');
            section.removeAttribute('data-shown');
            section.style.removeProperty('--step-delay');
        }
    });
}

function scrollWorkflowToSection(section) {
    const container = document.getElementById('workflowPanel');
    if (!container || !section) return;
    const targetOffset = section.offsetTop - container.offsetTop;
    container.scrollTo({
        top: Math.max(targetOffset - 12, 0),
        behavior: 'smooth'
    });
}

function regenerateDraft() {
    const textarea = document.getElementById('draftTextarea');
    if (!textarea) return;
    textarea.value = getDraftTemplate();
}

function getDraftTemplate() {
    const role = workflowState.selectedRole || 'Senior UX role';

    if (workflowState.tone === 'professional') {
        return `Hello Yash,\n\nI'm reaching out because your background in Design Systems stands out for our ${role}. We rely on meticulous Figma workflows and believe your expertise could elevate the team. Would you be available for a short conversation this week?\n\nBest regards,`;
    }

    return `Hi Yash, I saw your work on Design Systems and think you'd be perfect for our ${role}. We use Figma extensively. Open to a chat?`;
}

function showWorkflowToast(message) {
    const toast = document.getElementById('workflowToast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    if (workflowToastTimeout) {
        clearTimeout(workflowToastTimeout);
    }

    workflowToastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2200);
}

function startJdProcessing() {
    const progress = document.getElementById('jdProgress');
    const status = document.getElementById('jdProgressStatus');
    const barFill = document.getElementById('jdProgressBarFill');

    if (progress) {
        progress.classList.remove('hidden', 'complete');
        requestAnimationFrame(() => progress.classList.add('active'));
    }

    if (status) {
        status.textContent = 'Analyzing…';
    }

    if (barFill) {
        barFill.style.transition = 'none';
        barFill.style.width = '0%';
        requestAnimationFrame(() => {
            barFill.style.transition = 'width 1.4s ease';
            barFill.style.width = '100%';
        });
    }

    if (jdProgressTimeout) {
        clearTimeout(jdProgressTimeout);
    }

    jdProgressTimeout = setTimeout(() => {
        completeJdProcessing(progress, status);
    }, 1600);
}

function completeJdProcessing(progress, status) {
    workflowState.selectedRole = 'Uploaded JD';
    updateSelectedRoleText();
    if (status) {
        status.textContent = 'Match ready';
    }
    showWorkflowToast('JD uploaded successfully');
    setWorkflowStep(2);

    if (progress) {
        progress.classList.add('complete');
        setTimeout(() => {
            progress.classList.remove('active');
            progress.classList.add('hidden');
        }, 700);
    }
}

function resetWorkflow() {
    const roleSelect = document.getElementById('roleSelect');
    const uploadJdBtn = document.getElementById('uploadJdBtn');
    const jdProgress = document.getElementById('jdProgress');
    const jdProgressStatus = document.getElementById('jdProgressStatus');
    const jdProgressBarFill = document.getElementById('jdProgressBarFill');

    if (roleSelect && roleSelect.options.length) {
        roleSelect.value = roleSelect.options[0].value;
        workflowState.selectedRole = roleSelect.value;
    } else {
        workflowState.selectedRole = 'Senior UX Designer';
    }

    workflowState.currentStep = 0;
    workflowState.tone = 'casual';

    document.querySelectorAll('.tone-toggle').forEach(toggle => {
        const isActive = (toggle.dataset.tone || 'casual') === workflowState.tone;
        toggle.classList.toggle('active', isActive);
    });

    if (uploadJdBtn) {
        uploadJdBtn.style.display = '';
    }

    if (jdProgressTimeout) {
        clearTimeout(jdProgressTimeout);
        jdProgressTimeout = null;
    }

    if (jdProgress) {
        jdProgress.classList.add('hidden');
        jdProgress.classList.remove('active', 'complete');
    }

    if (jdProgressStatus) {
        jdProgressStatus.textContent = 'Analyzing…';
    }

    if (jdProgressBarFill) {
        jdProgressBarFill.style.transition = 'none';
        jdProgressBarFill.style.width = '0%';
    }

    setWorkflowStep(0);
    updateSelectedRoleText();
    regenerateDraft();
    // remove all chat threads (user + ai messages) so the conversation is cleared
    document.querySelectorAll('.workflow-content .chat-thread').forEach(thread => {
        thread.innerHTML = '';
    });
    // restore welcome card when chats are cleared
    const welcomeCard = document.querySelector('.welcome-card');
    if (welcomeCard) welcomeCard.classList.remove('hidden');

    showWorkflowToast('New chat');
    // show the suggestion bubble again when the chat is cleared
    showSuggestionBubble(true);
}

function openGmailComposer() {
    let gmailTab = tabs.find(tab => tab.type === 'gmail');
    if (!gmailTab) {
        tabCounter++;
        gmailTab = {
            id: `tab-${tabCounter}`,
            title: 'Gmail',
            image: 'images/mail.png',
            active: false,
            type: 'gmail'
        };
        tabs.push(gmailTab);
    }
    
    tabs.forEach(tab => tab.active = tab.id === gmailTab.id);
    updateTabs();
    switchTab(gmailTab.id);

    const composeData = getGmailComposeData();
    const existingView = document.getElementById(`webView-${gmailTab.id}`);
    if (!existingView) {
        const contentArea = document.querySelector('.content-area');
        const overlay = document.getElementById('webViewOverlay');
        const webView = document.createElement('div');
        webView.className = 'web-view-container gmail-view active';
        webView.id = `webView-${gmailTab.id}`;
        webView.dataset.tabId = gmailTab.id;

        const background = document.createElement('div');
        background.className = 'gmail-background';
        background.style.backgroundImage = `url('${gmailTab.image}')`;

        const composer = document.createElement('div');
        composer.className = 'gmail-composer';
        composer.innerHTML = `
            <div class="gmail-composer-header">
                <span>New Message</span>
                <div class="gmail-composer-actions">
                    <button title="Minimize">-</button>
                    <button title="Close">×</button>
                </div>
            </div>
            <div class="gmail-composer-field">
                <label>To</label>
                <input type="text" value="${composeData.to}" />
            </div>
            <div class="gmail-composer-field">
                <label>Subject</label>
                <input type="text" value="${composeData.subject}" />
            </div>
            <textarea>${composeData.body}</textarea>
            <div class="gmail-composer-footer">
                <button class="gmail-send-btn">Send</button>
                <div class="gmail-icons">
                    <span>Attach</span>
                    <span>Emoji</span>
                </div>
            </div>
        `;

        background.appendChild(composer);
        webView.appendChild(background);
        renderGmailModal(webView, composeData);

        if (contentArea) {
            if (overlay && contentArea.contains(overlay)) {
                contentArea.insertBefore(webView, overlay);
            } else {
                contentArea.appendChild(webView);
            }
        }
    } else {
        updateTabs();
        switchTab(gmailTab.id);

        const textarea = existingView.querySelector('.gmail-composer textarea');
        if (textarea) {
            textarea.value = composeData.body;
        }
        const subjectInput = existingView.querySelector('.gmail-composer-field:nth-of-type(2) input');
        if (subjectInput) {
            subjectInput.value = composeData.subject;
        }
        const toInput = existingView.querySelector('.gmail-composer-field:nth-of-type(1) input');
        if (toInput) {
            toInput.value = composeData.to;
        }
        renderGmailModal(existingView, composeData);
    }
}

function getGmailComposeData() {
    return {
        to: 'yash@gmail.com',
        subject: 'Product designer opportunity',
        body: getDraftTemplate()
    };
}

function renderGmailModal(webView, composeData) {
    if (!webView) return;
    let overlay = webView.querySelector('.gmail-modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'gmail-modal-overlay';
        overlay.innerHTML = `
            <div class="gmail-modal">
                <div class="gmail-modal-header">
                    <span>New Message</span>
                    <div class="gmail-modal-header-actions">
                        <button title="Minimize">-</button>
                        <button title="Fullscreen">▢</button>
                        <button title="Close" class="gmail-modal-close">×</button>
                    </div>
                </div>
                <div class="gmail-modal-field">
                    <label>To</label>
                    <input type="text" class="gmail-modal-to" />
                    <div class="cc-links">
                        <span>Cc</span>
                        <span>Bcc</span>
                    </div>
                </div>
                <div class="gmail-modal-field">
                    <label>Subject</label>
                    <input type="text" class="gmail-modal-subject" />
                </div>
                <textarea class="gmail-modal-body"></textarea>
                <div class="gmail-modal-footer">
                    <button class="gmail-send-btn gmail-modal-send">Send</button>
                    <div class="gmail-icons">
                        <span class="gmail-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8">
                                <path d="M21.44 11.05l-8.49 8.49a5 5 0 0 1-7.07-7.07l8.49-8.49a3 3 0 1 1 4.24 4.24l-8.49 8.49a1 1 0 0 1-1.41-1.41l7.78-7.78" />
                            </svg>
                        </span>
                        <span class="gmail-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8">
                                <circle cx="12" cy="12" r="9" />
                                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                                <line x1="9" y1="10" x2="9" y2="10" />
                                <line x1="15" y1="10" x2="15" y2="10" />
                            </svg>
                        </span>
                        <span class="gmail-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8">
                                <path d="M10 13a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0-7.07-7.07L10 6" />
                                <path d="M14 11a5 5 0 0 0-7.07 0L5.5 12.43a5 5 0 0 0 7.07 7.07L14 18" />
                            </svg>
                        </span>
                    </div>
                </div>
            </div>
        `;
        overlay.querySelector('.gmail-modal-close').addEventListener('click', () => {
            overlay.remove();
        });
        webView.appendChild(overlay);
    }

    const toInput = overlay.querySelector('.gmail-modal-to');
    const subjectInput = overlay.querySelector('.gmail-modal-subject');
    const bodyArea = overlay.querySelector('.gmail-modal-body');
    if (toInput) toInput.value = composeData.to;
    if (subjectInput) subjectInput.value = composeData.subject;
    if (bodyArea) bodyArea.value = composeData.body;

    const sendBtn = overlay.querySelector('.gmail-modal-send');
    if (sendBtn) {
        sendBtn.onclick = () => {
            overlay.remove();
            showWorkflowToast('Email sent');
        };
    }
}

// Analytics
function toggleAnalytics() {
    // Check if analytics tab already exists
    const existingAnalyticsTab = tabs.find(t => t.type === 'analytics');
    
    if (existingAnalyticsTab && existingAnalyticsTab.active) {
        removeTabById(existingAnalyticsTab.id);
        return;
    }
    
    if (existingAnalyticsTab) {
        // Switch to existing analytics tab
        switchTab(existingAnalyticsTab.id);
    } else {
        // Create new analytics tab
        tabCounter++;
        const analyticsTab = {
            id: `tab-${tabCounter}`,
            title: 'Analytics',
            active: false,
            type: 'analytics'
        };
        
        tabs.forEach(tab => tab.active = false);
        tabs.push(analyticsTab);
        analyticsTab.active = true;
        
        updateTabs();
        switchTab(analyticsTab.id);
    }
}

function updateAnalytics() {
    const profilesEl = document.getElementById('profilesScanned');
    const emailsEl = document.getElementById('emailsSent');
    const successEl = document.getElementById('successRate');
    const timeSavedEl = document.getElementById('timeSaved');
    const interventionEl = document.getElementById('interventionRate');

    if (profilesEl) profilesEl.textContent = analyticsData.profilesScanned;
    if (emailsEl) emailsEl.textContent = analyticsData.emailsSent;
    if (successEl) successEl.textContent = analyticsData.successRate + '%';
    if (timeSavedEl) timeSavedEl.textContent = analyticsData.timeSavedHours + ' Hours';
    if (interventionEl) interventionEl.textContent = analyticsData.interventionRate + '%';

    // Update activity table with Outcome and Quality Score
    const tbody = document.getElementById('activityTableBody');
    tbody.innerHTML = '';

    analyticsData.activities.forEach(activity => {
        const row = document.createElement('tr');
        const qualityClass = activity.quality === 'high' ? 'quality-badge high' : (activity.quality === 'med' ? 'quality-badge med' : 'quality-badge low');
        const outcomeText = activity.outcome || '';
        const actionCell = `${activity.action}${(activity.action || '').toLowerCase().includes('email') ? ` <a href="#" class="view-link" data-profile="${activity.profile}">View</a>` : ''}`;

        row.innerHTML = `
            <td>${activity.time}</td>
            <td>${activity.profile}</td>
            <td>${actionCell}</td>
            <td>${outcomeText}</td>
            <td><span class="status-badge ${activity.status}">${activity.status}</span></td>
            <td><span class="${qualityClass}">${activity.quality.toUpperCase()}</span></td>
        `;
        tbody.appendChild(row);
    });

    // Attach handlers to View links
    document.querySelectorAll('.activity-table a.view-link').forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            const profile = a.dataset.profile;
            showWorkflowToast('Opening detail for ' + profile);
        });
    });

    // redraw charts using current data
    drawFunnelChart();
    drawInterventionChart();
}

function addActivity(action, profile, status) {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    analyticsData.activities.unshift({
        time: time,
        profile: profile,
        action: action,
        status: status
    });
    
    // Keep only last 10 activities
    if (analyticsData.activities.length > 10) {
        analyticsData.activities.pop();
    }
    
    updateAnalytics();
}

// Charts
function initializeCharts() {
    drawActivityChart();
    drawFunnelChart();
    drawInterventionChart();
}

function drawActivityChart() {
    const canvas = document.getElementById('activityChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.offsetWidth;
    const height = 250;
    canvas.width = width;
    canvas.height = height;
    
    // Sample data - hours of the day
    const hours = ['8', '9', '10', '11', '12', '1', '2', '3', '4', '5'];
    const values = [2, 5, 8, 6, 4, 3, 2, 1, 1, 0];
    const maxValue = Math.max(...values);
    
    // Draw chart
    ctx.clearRect(0, 0, width, height);
    
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const barWidth = chartWidth / hours.length;
    
    // Draw bars
    values.forEach((value, index) => {
        const barHeight = (value / maxValue) * chartHeight;
        const x = padding + index * barWidth + barWidth * 0.1;
        const y = height - padding - barHeight;
        
        // Gradient
        const gradient = ctx.createLinearGradient(0, y, 0, height - padding);
        gradient.addColorStop(0, '#1a73e8');
        gradient.addColorStop(1, '#4285f4');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth * 0.8, barHeight);
        
        // Value label
        if (value > 0) {
            ctx.fillStyle = '#202124';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(value.toString(), x + barWidth * 0.4, y - 5);
        }
    });
    
    // Draw labels
    ctx.fillStyle = '#5f6368';
    ctx.font = '11px Inter';
    ctx.textAlign = 'center';
    hours.forEach((hour, index) => {
        const x = padding + index * barWidth + barWidth * 0.5;
        ctx.fillText(hour + 'h', x, height - 10);
    });
}

function drawPerformanceChart() {
    const canvas = document.getElementById('performanceChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.offsetWidth;
    const height = 250;
    canvas.width = width;
    canvas.height = height;
    
    // Sample data - days of week
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const successRates = [70, 75, 80, 78, 82, 65, 60];
    
    ctx.clearRect(0, 0, width, height);
    
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const pointSpacing = chartWidth / (days.length - 1);
    
    // Draw grid lines
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padding + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }
    
    // Draw line
    ctx.strokeStyle = '#1a73e8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    days.forEach((day, index) => {
        const x = padding + index * pointSpacing;
        const y = padding + chartHeight - (successRates[index] / 100) * chartHeight;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
        
        // Draw point
        ctx.fillStyle = '#1a73e8';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
    });
    
    ctx.stroke();
    
    // Draw labels
    ctx.fillStyle = '#5f6368';
    ctx.font = '11px Inter';
    ctx.textAlign = 'center';
    days.forEach((day, index) => {
        const x = padding + index * pointSpacing;
        ctx.fillText(day, x, height - 10);
    });
    
    // Y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
        const y = padding + (chartHeight / 4) * (4 - i);
        ctx.fillText((i * 25) + '%', padding - 10, y + 4);
    }
}

// draw a simple donut chart for intervention analysis
function drawInterventionChart() {
    const canvas = document.getElementById('interventionChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.offsetWidth;
    const height = canvas.parentElement.offsetHeight;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#ffffff' : '#202124';

    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 3.4;
    let start = -Math.PI / 2;

    analyticsData.interventionBreakdown.forEach(segment => {
        const slice = (segment.value / 100) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, start, start + slice);
        ctx.closePath();
        ctx.fillStyle = segment.color;
        ctx.fill();

        // label with label in text color and percentage in segment color
        const mid = start + slice / 2;
        const lx = cx + (radius + 18) * Math.cos(mid);
        const ly = cy + (radius + 18) * Math.sin(mid);
        ctx.font = '12px Inter';
        ctx.textAlign = lx > cx ? 'left' : 'right';
        
        // Draw label in text color
        ctx.fillStyle = textColor;
        ctx.fillText(`${segment.label} `, lx, ly);
        
        // Measure text width to position percentage right after label
        const labelWidth = ctx.measureText(`${segment.label} `).width;
        ctx.fillStyle = segment.color;
        ctx.fillText(`(${segment.value}%)`, lx + (lx > cx ? labelWidth : -labelWidth), ly);

        start += slice;
    });
}

// draw a horizontal bar chart showing recruitment funnel
function drawFunnelChart() {
    const canvas = document.getElementById('funnelChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.offsetWidth;
    const height = canvas.parentElement.offsetHeight;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#ffffff' : '#202124';

    const padding = 16;
    const barHeight = 32;
    const gap = 12;
    const maxCount = Math.max(...analyticsData.funnel.map(s => s.count));
    const fullBarWidth = width - padding * 2 - 80; // Reserve space for count label

    // Define colors for each bar
    const barColors = ['#1a73e8', '#43a047', '#00897b', '#00bcd4'];

    analyticsData.funnel.forEach((stage, index) => {
        const filledWidth = (stage.count / maxCount) * fullBarWidth;
        const y = padding + index * (barHeight + gap);
        const barColor = barColors[index] || '#1a73e8';

        // Filled bar (proportional to count)
        ctx.fillStyle = barColor;
        ctx.fillRect(padding, y, filledWidth, barHeight);

        // Stage label on the bar (text color based on mode)
        ctx.fillStyle = textColor;
        ctx.font = 'bold 13px Inter';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(stage.stage, padding + 12, y + barHeight / 2);

        // Count label at the right (text color based on mode)
        ctx.fillStyle = textColor;
        ctx.font = 'bold 13px Inter';
        ctx.textAlign = 'right';
        ctx.fillText(stage.count.toString(), padding + fullBarWidth + 12, y + barHeight / 2);
    });
}

// Resize charts on window resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        initializeCharts();
    }, 250);
});

// Dark Mode Setup
function setupDarkMode() {
    const darkModeBtn = document.getElementById('darkModeToggle');
    const sunIcon = darkModeBtn ? darkModeBtn.querySelector('.sun-icon') : null;
    const moonIcon = darkModeBtn ? darkModeBtn.querySelector('.moon-icon') : null;
    
    if (!darkModeBtn) return;
    
    // Load saved preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    if (savedDarkMode) {
        document.body.classList.add('dark-mode');
        if (sunIcon && moonIcon) {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        }
    }
    
    // Toggle dark mode on button click
    darkModeBtn.addEventListener('click', () => {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        
        if (sunIcon && moonIcon) {
            sunIcon.style.display = isDarkMode ? 'none' : 'block';
            moonIcon.style.display = isDarkMode ? 'block' : 'none';
        }
        
        // Redraw charts with new text colors
        initializeCharts();
    });
}
