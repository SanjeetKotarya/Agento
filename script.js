// Tab Management
let tabs = [
    { id: 'tab-1', title: 'LinkedIn Profile', image: 'profile.png', active: true, type: 'web' }
];
let tabCounter = 1;

// Analytics Data
let analyticsData = {
    profilesScanned: 24,
    emailsSent: 18,
    successRate: 75,
    avgTime: 2.4,
    activities: [
        { time: '09:15 AM', profile: 'John Doe', action: 'Profile Scanned', status: 'success' },
        { time: '09:22 AM', profile: 'Jane Smith', action: 'Email Sent', status: 'success' },
        { time: '09:30 AM', profile: 'Bob Johnson', action: 'Profile Scanned', status: 'success' },
        { time: '09:35 AM', profile: 'Alice Brown', action: 'Email Sent', status: 'success' },
        { time: '09:42 AM', profile: 'Charlie Wilson', action: 'Profile Scanned', status: 'pending' },
    ]
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    initializeCharts();
    updateAnalytics();
    initializeTabs();
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
        image: 'google.png',
        active: false,
        type: 'web'
    };
    
    tabs.forEach(tab => tab.active = false);
    tabs.push(newTab);
    newTab.active = true;
    
    // Create web view container for new tab
    const contentArea = document.querySelector('.content-area');
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
    contentArea.appendChild(webView);
    
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
    } else {
        // Show web view
        const activeView = document.getElementById(`webView-${tabId}`);
        if (activeView) {
            activeView.classList.add('active');
        } else {
            // Create if doesn't exist
            if (activeTab.image) {
                const contentArea = document.querySelector('.content-area');
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
                contentArea.appendChild(webView);
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
    overlay.classList.toggle('active');
    
    const btn = document.getElementById('aiAssistantBtn');
    btn.classList.toggle('active');
}

function closeWorkflowPanel() {
    const overlay = document.getElementById('webViewOverlay');
    overlay.classList.remove('active');
    
    const btn = document.getElementById('aiAssistantBtn');
    btn.classList.remove('active');
}

function scanLinkedInProfile() {
    const scanBtn = document.getElementById('scanBtn');
    const scanStatusText = document.getElementById('scanStatusText');
    
    scanBtn.disabled = true;
    scanStatusText.innerHTML = '<span class="loading"></span> Scanning profile...';
    
    // Simulate profile scanning
    setTimeout(() => {
        // Mock profile data (in real app, this would be extracted from the page)
        const mockProfileData = {
            name: 'John Doe',
            title: 'Senior Software Engineer',
            company: 'Tech Corp Inc.',
            location: 'San Francisco, CA',
            email: 'john.doe@techcorp.com',
            experience: '8 years in software development, specializing in AI/ML'
        };
        
        displayProfileData(mockProfileData);
        scanStatusText.textContent = 'Profile scanned successfully!';
        scanBtn.disabled = false;
        
        // Update analytics
        analyticsData.profilesScanned++;
        updateAnalytics();
        
        // Add activity
        addActivity('Profile Scanned', mockProfileData.name, 'success');
    }, 2000);
}

function displayProfileData(data) {
    document.getElementById('profileName').textContent = data.name;
    document.getElementById('profileTitle').textContent = data.title;
    document.getElementById('profileCompany').textContent = data.company;
    document.getElementById('profileLocation').textContent = data.location;
    document.getElementById('profileEmail').textContent = data.email;
    document.getElementById('profileExperience').textContent = data.experience;
    
    document.getElementById('profileDataSection').style.display = 'block';
    document.getElementById('emailSection').style.display = 'block';
    
    // Pre-fill email
    document.getElementById('emailTo').value = data.email;
    document.getElementById('emailSubject').value = `Connecting with ${data.name} - ${data.title} at ${data.company}`;
    
    // Generate initial message
    generateAIMessage();
}

function generateAIMessage() {
    const name = document.getElementById('profileName').textContent;
    const title = document.getElementById('profileTitle').textContent;
    const company = document.getElementById('profileCompany').textContent;
    
    const message = `Hi ${name},

I came across your profile and was impressed by your experience as a ${title} at ${company}. Your background in the industry aligns well with what we're working on.

I'd love to connect and explore potential collaboration opportunities. Would you be open to a brief conversation?

Best regards`;
    
    document.getElementById('emailMessage').value = message;
}

function sendEmail() {
    const emailTo = document.getElementById('emailTo').value;
    const emailSubject = document.getElementById('emailSubject').value;
    const emailMessage = document.getElementById('emailMessage').value;
    
    if (!emailTo || !emailSubject || !emailMessage) {
        alert('Please fill in all email fields');
        return;
    }
    
    // Simulate sending email
    const sendBtn = document.querySelector('.btn-primary');
    const originalText = sendBtn.innerHTML;
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span class="loading"></span> Sending...';
    
    setTimeout(() => {
        sendBtn.disabled = false;
        sendBtn.innerHTML = originalText;
        
        // Show success message
        alert('Email sent successfully!');
        
        // Update analytics
        analyticsData.emailsSent++;
        analyticsData.successRate = Math.round((analyticsData.emailsSent / analyticsData.profilesScanned) * 100);
        updateAnalytics();
        
        // Add activity
        const name = document.getElementById('profileName').textContent;
        addActivity('Email Sent', name, 'success');
        
        // Reset form
        document.getElementById('emailMessage').value = '';
    }, 1500);
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
    document.getElementById('profilesScanned').textContent = analyticsData.profilesScanned;
    document.getElementById('emailsSent').textContent = analyticsData.emailsSent;
    document.getElementById('successRate').textContent = analyticsData.successRate + '%';
    document.getElementById('avgTime').textContent = analyticsData.avgTime + ' min';
    
    // Update activity table
    const tbody = document.getElementById('activityTableBody');
    tbody.innerHTML = '';
    
    analyticsData.activities.forEach(activity => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${activity.time}</td>
            <td>${activity.profile}</td>
            <td>${activity.action}</td>
            <td><span class="status-badge ${activity.status}">${activity.status}</span></td>
        `;
        tbody.appendChild(row);
    });
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
    drawPerformanceChart();
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

// Resize charts on window resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        initializeCharts();
    }, 250);
});
