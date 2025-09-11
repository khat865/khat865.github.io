// 访客记录系统
class VisitorTracker {
    constructor() {
        this.startTime = Date.now();
        this.sessionId = this.generateSessionId();
        this.visitorData = {};
        this.init();
    }

    // 初始化访客追踪
    init() {
        this.collectVisitorInfo();
        this.recordVisit();
        this.setupPageLeaveTracking();
        this.setupHeartbeat();
    }

    // 生成会话ID
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // 收集访客信息
    collectVisitorInfo() {
        this.visitorData = {
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            referrer: document.referrer || 'Direct',
            userAgent: navigator.userAgent,
            language: navigator.language,
            screenResolution: `${screen.width}x${screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled,
            onlineStatus: navigator.onLine
        };
    }

    // 获取IP地址和位置信息
    async getIPInfo() {
        try {
            // 使用免费的IP API服务
            const response = await fetch('https://ipapi.co/json/');
            const ipData = await response.json();
            
            this.visitorData.ip = ipData.ip;
            this.visitorData.city = ipData.city;
            this.visitorData.region = ipData.region;
            this.visitorData.country = ipData.country_name;
            this.visitorData.isp = ipData.org;
            
            return ipData;
        } catch (error) {
            console.warn('Unable to fetch IP info:', error);
            // 备用API
            try {
                const response = await fetch('https://api.ipify.org?format=json');
                const data = await response.json();
                this.visitorData.ip = data.ip;
            } catch (fallbackError) {
                console.warn('Fallback IP fetch failed:', fallbackError);
                this.visitorData.ip = 'Unknown';
            }
        }
    }

    // 记录访问（发送到后端或第三方服务）
    async recordVisit() {
        await this.getIPInfo();
        
        // 方案1: 发送到Google Analytics（如果配置了）
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_view', {
                page_title: document.title,
                page_location: window.location.href,
                custom_map: {
                    'custom_session_id': this.sessionId
                }
            });
        }

        // 方案2: 发送到自定义API
        this.sendToCustomAPI();

        // 方案3: 存储到本地（用于演示）
        this.saveToLocalStorage();

        // 方案4: 发送到第三方服务（如Supabase）
        this.sendToSupabase();
    }

    // 发送到自定义API
    async sendToCustomAPI() {
        try {
            // 替换为你的API端点
            const API_ENDPOINT = 'https://your-api.com/visitor-log';
            
            await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.visitorData)
            });
        } catch (error) {
            console.warn('Failed to send to custom API:', error);
        }
    }

    // 发送到Supabase（需要配置）
    async sendToSupabase() {
        try {
            // 替换为你的Supabase配置
            const SUPABASE_URL = 'YOUR_SUPABASE_URL';
            const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
            
            if (SUPABASE_URL && SUPABASE_KEY && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
                await fetch(`${SUPABASE_URL}/rest/v1/visitor_logs`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    },
                    body: JSON.stringify(this.visitorData)
                });
            }
        } catch (error) {
            console.warn('Failed to send to Supabase:', error);
        }
    }

    // 保存到本地存储（仅用于演示和调试）
    saveToLocalStorage() {
        try {
            const visits = JSON.parse(localStorage.getItem('visitorLogs') || '[]');
            visits.push(this.visitorData);
            
            // 只保留最近100条记录
            if (visits.length > 100) {
                visits.splice(0, visits.length - 100);
            }
            
            localStorage.setItem('visitorLogs', JSON.stringify(visits));
            console.log('Visitor data saved locally:', this.visitorData);
        } catch (error) {
            console.warn('Failed to save to localStorage:', error);
        }
    }

    // 计算停留时间
    getStayDuration() {
        return Math.floor((Date.now() - this.startTime) / 1000); // 秒
    }

    // 设置页面离开追踪
    setupPageLeaveTracking() {
        window.addEventListener('beforeunload', () => {
            this.recordPageLeave();
        });

        // 处理页面隐藏（切换标签页等）
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.recordPageLeave();
            }
        });
    }

    // 记录页面离开
    recordPageLeave() {
        const stayDuration = this.getStayDuration();
        const leaveData = {
            sessionId: this.sessionId,
            action: 'page_leave',
            stayDuration: stayDuration,
            timestamp: new Date().toISOString()
        };

        // 使用sendBeacon确保数据发送（即使页面关闭）
        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/visitor-leave', JSON.stringify(leaveData));
        }

        // 更新本地存储
        try {
            const visits = JSON.parse(localStorage.getItem('visitorLogs') || '[]');
            const currentVisit = visits.find(v => v.sessionId === this.sessionId);
            if (currentVisit) {
                currentVisit.stayDuration = stayDuration;
                currentVisit.leaveTime = new Date().toISOString();
                localStorage.setItem('visitorLogs', JSON.stringify(visits));
            }
        } catch (error) {
            console.warn('Failed to update stay duration:', error);
        }
    }

    // 设置心跳检测（每30秒发送一次活跃信号）
    setupHeartbeat() {
        setInterval(() => {
            if (!document.hidden) {
                this.sendHeartbeat();
            }
        }, 30000); // 30秒
    }

    // 发送心跳信号
    sendHeartbeat() {
        const heartbeatData = {
            sessionId: this.sessionId,
            action: 'heartbeat',
            currentDuration: this.getStayDuration(),
            timestamp: new Date().toISOString(),
            scrollPosition: window.pageYOffset,
            activeElement: document.activeElement.tagName
        };

        // 发送到API或更新本地存储
        try {
            const visits = JSON.parse(localStorage.getItem('visitorLogs') || '[]');
            const currentVisit = visits.find(v => v.sessionId === this.sessionId);
            if (currentVisit) {
                currentVisit.lastHeartbeat = heartbeatData.timestamp;
                currentVisit.currentDuration = heartbeatData.currentDuration;
                localStorage.setItem('visitorLogs', JSON.stringify(visits));
            }
        } catch (error) {
            console.warn('Failed to update heartbeat:', error);
        }
    }

    // 获取访客统计信息（用于管理面板）
    static getVisitorStats() {
        try {
            const visits = JSON.parse(localStorage.getItem('visitorLogs') || '[]');
            const stats = {
                totalVisits: visits.length,
                uniqueIPs: [...new Set(visits.map(v => v.ip))].length,
                averageStayTime: visits.reduce((sum, v) => sum + (v.stayDuration || 0), 0) / visits.length,
                topCountries: this.getTopItems(visits, 'country'),
                topCities: this.getTopItems(visits, 'city'),
                topReferrers: this.getTopItems(visits, 'referrer'),
                recentVisits: visits.slice(-10).reverse()
            };
            return stats;
        } catch (error) {
            console.warn('Failed to get visitor stats:', error);
            return null;
        }
    }

    // 获取排行榜数据
    static getTopItems(visits, field) {
        const counts = {};
        visits.forEach(visit => {
            const value = visit[field] || 'Unknown';
            counts[value] = (counts[value] || 0) + 1;
        });
        
        return Object.entries(counts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));
    }
}

// 初始化访客追踪
document.addEventListener('DOMContentLoaded', () => {
    // 检查是否启用访客追踪
    const trackingEnabled = true; // 可以通过配置控制
    
    if (trackingEnabled) {
        window.visitorTracker = new VisitorTracker();
        console.log('Visitor tracking initialized');
    }
});

// 导出类以供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VisitorTracker;
}