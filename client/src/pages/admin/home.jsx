import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { PieChart, Pie, Cell } from "recharts";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import AnimatedBackground from "../../components/AnimatedBackground";
import "../../styles/admin/home.css";
import axios from "axios";

function AdminHome() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    
    const API_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
    
    const [month, set_month] = useState([]);
    const [category, set_category] = useState([]);
    const [average, set_average] = useState([]);
    const [stats, setStats] = useState({
        totalOpenIssues: 0,
        submittedIssues: 0,
        underReviewIssues: 0,
        resolvedIssues: 0,
        totalApplications: 0,
        activeJobs: 0,
        completionRate: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const COLORS = ["#0088FE", "#00C49F", "#9b0ef3ff", "#FF8042", "#a2ac49ff"];

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError('');
            const [issuesRes, pendingAppsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/issues`),
                axios.get(`${API_BASE_URL}/api/issues/applications/pending`)
            ]);

            const issues = issuesRes.data?.issues || [];
            const pendingApps = pendingAppsRes.data?.applications || [];

            // Normalize and compute stats
            const normalized = issues.map((i) => ({
                id: i.ISSUE_ID || i.issue_id || i.ID,
                status: (i.STATUS || i.status || '').toLowerCase(),
                category: i.CATEGORY || i.category,
                created_at: i.CREATED_AT || i.created_at,
                updated_at: i.UPDATED_AT || i.updated_at
            }));

            const openSet = new Set(['submitted','applied','assigned','in_progress','under_review']);
            const totalOpenIssues = normalized.filter(i => openSet.has(i.status)).length;
            const submittedIssues = normalized.filter(i => i.status === 'submitted').length;
            const underReviewIssues = normalized.filter(i => i.status === 'under_review').length;
            const resolvedIssues = normalized.filter(i => i.status === 'resolved').length;
            const activeJobs = normalized.filter(i => ['assigned','in_progress'].includes(i.status)).length;
            const total = normalized.length || 0;
            const completionRate = total ? Math.round((resolvedIssues / total) * 100) : 0;

            setStats({
                totalOpenIssues,
                submittedIssues,
                underReviewIssues,
                resolvedIssues,
                totalApplications: pendingApps.length,
                activeJobs,
                completionRate
            });

            // Category distribution
            const catCounts = normalized.reduce((acc, cur) => {
                const key = cur.category || 'Other';
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {});
            const catData = Object.entries(catCounts).map(([name, value]) => ({ name, value }));
            set_category(catData);

            // Monthly performance (last 6 months): created vs resolved per month
            const now = new Date();
            const months = Array.from({ length: 6 }, (_, idx) => {
                const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
                return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('default', { month: 'short' }) };
            });

            const monthData = months.map(m => ({ name: m.label, Assigned: 0, Solved: 0 }));
            normalized.forEach(i => {
                if (i.created_at) {
                    const d = new Date(i.created_at);
                    const k = `${d.getFullYear()}-${d.getMonth()}`;
                    const idx = months.findIndex(mm => mm.key === k);
                    if (idx >= 0) monthData[idx].Assigned += 1;
                }
                if (i.status === 'resolved' && i.updated_at) {
                    const d = new Date(i.updated_at);
                    const k = `${d.getFullYear()}-${d.getMonth()}`;
                    const idx = months.findIndex(mm => mm.key === k);
                    if (idx >= 0) monthData[idx].Solved += 1;
                }
            });
            set_month(monthData);

            // Activity trends - last 20 days: counts per day
            const days = Array.from({ length: 20 }, (_, i) => {
                const d = new Date(now);
                d.setDate(d.getDate() - (19 - i));
                const iso = d.toISOString().split('T')[0];
                return { date: iso, avgResolution: 0, avgAdded: 0 };
            });
            normalized.forEach(i => {
                if (i.created_at) {
                    const iso = new Date(i.created_at).toISOString().split('T')[0];
                    const idx = days.findIndex(d => d.date === iso);
                    if (idx >= 0) days[idx].avgAdded += 1;
                }
                if (i.status === 'resolved' && i.updated_at) {
                    const iso = new Date(i.updated_at).toISOString().split('T')[0];
                    const idx = days.findIndex(d => d.date === iso);
                    if (idx >= 0) days[idx].avgResolution += 1;
                }
            });
            set_average(days);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            setError(error.response?.data?.message || 'Failed to load admin dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const quickActions = [
        {
            title: 'Review Issues',
            description: 'Newly submitted issues awaiting triage',
            icon: '�️',
            action: () => navigate('/admin?tab=issues'),
            color: '#3b82f6',
            count: stats.submittedIssues
        },
        {
            title: 'Worker Applications',
            description: 'Review pending worker applications',
            icon: '📨',
            action: () => navigate('/admin?tab=applications'),
            color: '#f59e0b',
            count: stats.totalApplications
        },
        {
            title: 'Review Problems',
            description: 'Proof submitted and under review',
            icon: '🧾',
            action: () => navigate('/admin?tab=review-problems'),
            color: '#10b981',
            count: stats.underReviewIssues
        },
        {
            title: 'Payment Management',
            description: 'Process worker payments and manage transactions',
            icon: '💰',
            action: () => navigate('/admin?tab=payment'),
            color: '#8b5cf6',
            count: null
        }
    ];

    function formatDateTicks(ticks, index, allTicks) {
        const date = new Date(ticks);
        const day = date.getDate();
        const month = date.toLocaleString("default", { month: "short" });
        const year = date.getFullYear();

        if (index === 0) return `${day} ${month}`;

        const prevDate = new Date(allTicks[index - 1]);

        if (
            date.getMonth() === prevDate.getMonth() &&
            date.getFullYear() === prevDate.getFullYear()
        ) {
            return `${day}`;
        }

        if (date.getFullYear() === prevDate.getFullYear()) {
            return `${month}`;
        }

        return `${year}`;
    }

    if (authLoading || loading) {
        return (
            <div className="admin-home-loading">
                <div className="loading-spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <AnimatedBackground>
            <div className="admin-home">
            {/* Welcome Section */}
            <div className="welcome-section">
                <div className="welcome-content">
                    <h1>Welcome back, {user?.name || 'Admin'}! 👨‍💼</h1>
                    <p>Monitor system performance and manage community operations efficiently.</p>
                </div>
                <div className="welcome-illustration">
                    <span className="admin-icon">⚙️</span>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-section">
                <h2>Quick Actions</h2>
                <div className="actions-grid">
                    {quickActions.map((action, index) => (
                        <div 
                            key={index} 
                            className="action-card"
                            onClick={action.action}
                            style={{ '--action-color': action.color }}
                        >
                            <div className="action-icon">{action.icon}</div>
                            <div className="action-content">
                                <h3>{action.title}</h3>
                                <p>{action.description}</p>
                            </div>
                            {action.count !== null && (
                                <div className="action-count">{action.count}</div>
                            )}
                            <div className="action-arrow">→</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Statistics Overview */}
            <div className="stats-overview">
                <h2>System Overview</h2>
                {error && (
                    <div className="error-banner" style={{ marginBottom: 16 }}>{error}</div>
                )}
                <div className="stats-grid">
                    <div className="stat-card open-issues">
                        <div className="stat-icon">�</div>
                        <div className="stat-info">
                            <h3>{stats.totalOpenIssues}</h3>
                            <p>Open Issues</p>
                        </div>
                    </div>
                    <div className="stat-card pending">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-info">
                            <h3>{stats.submittedIssues}</h3>
                            <p>New Submissions</p>
                        </div>
                    </div>
                    <div className="stat-card resolved">
                        <div className="stat-icon">✅</div>
                        <div className="stat-info">
                            <h3>{stats.resolvedIssues}</h3>
                            <p>Resolved Issues</p>
                        </div>
                    </div>
                    <div className="stat-card workers">
                        <div className="stat-icon">🧪</div>
                        <div className="stat-info">
                            <h3>{stats.underReviewIssues}</h3>
                            <p>Under Review</p>
                        </div>
                    </div>
                    <div className="stat-card completion">
                        <div className="stat-icon">📈</div>
                        <div className="stat-info">
                            <h3>{stats.completionRate}%</h3>
                            <p>Completion Rate</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="charts-section">
                <div className="chart-row">
                    <div className="chart-card">
                        <h3>Category Analysis</h3>
                        <PieChart width={350} height={250}>
                            <Pie
                                data={category}
                                cx="50%"
                                cy="50%"
                                outerRadius={70}
                                dataKey="value"
                                label
                            >
                                {category.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </div>

                    <div className="chart-card">
                        <h3>Monthly Performance</h3>
                        <BarChart width={400} height={250} data={month}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Assigned" fill="#8884d8" />
                            <Bar dataKey="Solved" fill="#82ca9d" />
                        </BarChart>
                    </div>
                </div>

                <div className="chart-row">
                    <div className="chart-card full-width">
                        <h3>Activity Trends - Last 20 Days</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={average}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(tick, index) =>
                                        formatDateTicks(tick, index, average.map((d) => d.date))
                                    }
                                />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="avgResolution"
                                    stroke="#8884d8"
                                    strokeWidth={3}
                                    activeDot={{ r: 6 }}
                                    name="Avg Resolved"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="avgAdded"
                                    stroke="#82ca9d"
                                    strokeWidth={3}
                                    activeDot={{ r: 6 }}
                                    name="Avg Added"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            </div>
        </AnimatedBackground>
    );
}

export default AdminHome;