import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AnimatedBackground from "../../components/AnimatedBackground";
import "../../styles/admin/payment.css";
import axios from "axios";

const API_BASE_URL = import.meta.env.SERVER_URL || 'http://localhost:5000';

function AdminPayment() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    
    const [paymentData, setPaymentData] = useState({
        remainingBalance: 0,
        currency: 'BDT',
        workItems: []
    });

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`${API_BASE_URL}/api/payments/pending`, { withCredentials: true });
                const data = res.data || { remainingBalance: 0, currency: 'BDT', workItems: [] };
                // add id for rendering key
                setPaymentData({
                    remainingBalance: data.remainingBalance,
                    currency: data.currency || 'BDT',
                    workItems: (data.workItems || []).map((w, idx) => ({ id: idx + 1, ...w }))
                });
            } catch (e) {
                console.error(e);
                setError('Failed to load pending payments');
            } finally {
                setLoading(false);
            }
        };
        fetchPayments();
    }, []);

    const handlePayNow = async () => {
        setPaymentProcessing(true);
        try {
            const toPay = paymentData.workItems.filter(i => i.status === 'Pending Payment');
            if (toPay.length === 0) return;
            const payload = {
                payments: toPay.map(i => ({
                    issueId: i.issueId || i.issue_id || i.issueId,
                    proofId: i.proofId,
                    workerId: i.workerId,
                    citizenId: i.citizenId,
                    amount: i.cost,
                    method: 'bkash'
                }))
            };
            await axios.post(`${API_BASE_URL}/api/payments`, payload, { withCredentials: true });
            alert('Payment processed successfully!');
            // refresh list
            const res = await axios.get(`${API_BASE_URL}/api/payments/pending`, { withCredentials: true });
            const data = res.data || { remainingBalance: 0, currency: 'BDT', workItems: [] };
            setPaymentData({
                remainingBalance: data.remainingBalance,
                currency: data.currency || 'BDT',
                workItems: (data.workItems || []).map((w, idx) => ({ id: idx + 1, ...w }))
            });
        } catch (error) {
            console.error(error);
            setError("Payment processing failed. Please try again.");
        } finally {
            setPaymentProcessing(false);
        }
    };

    const getTotalAmount = () => {
        return paymentData.workItems
            .filter(item => item.status === "Pending Payment")
            .reduce((total, item) => total + item.cost, 0);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: paymentData.currency
        }).format(amount);
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case "Pending Payment":
                return "status-pending";
            case "Paid":
                return "status-paid";
            default:
                return "status-default";
        }
    };

    if (authLoading || loading) {
        return (
            <div className="admin-payment">
                <AnimatedBackground />
                <div className="payment-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading payment information...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-payment">
                <AnimatedBackground />
                <div className="payment-error">
                    <h2>Error</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <AnimatedBackground >
            <div className="admin-payment">
                
                <div className="payment-header">
                    <h1>Payouts Management</h1>
                    <p>Manage payouts for completed work orders</p>
                </div>

                {/* Balance Overview */}
                <div className="balance-section">
                    <div className="balance-card" style={{backgroundColor: 'green'}}>
                        <div className="balance-info">
                            <h2>Remaining Balance</h2>
                            <div className="balance-amount">
                                {formatCurrency(paymentData.remainingBalance)}
                            </div>
                            <p className="balance-note">Available for payments</p>
                        </div>
                        <div className="balance-icon">
                            <i className="fas fa-wallet"></i>
                        </div>
                    </div>
                    
                    <div className="payment-summary">
                        <div className="summary-item">
                            <span className="summary-label">Total Due:</span>
                            <span className="summary-value due">{formatCurrency(getTotalAmount())}</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-label">Pending Items:</span>
                            <span className="summary-value">
                                {paymentData.workItems.filter(item => item.status === "Pending Payment").length}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Work Items List */}
                <div className="work-items-section">
                    <div className="section-header">
                        <h2>Work Orders & Payments</h2>
                        <div className="items-count">
                            {paymentData.workItems.length} total items
                        </div>
                    </div>

                    <div className="work-items-list">
                        {paymentData.workItems.map((item) => (
                            <div key={item.id} className="work-item-card">
                                <div className="item-header">
                                    <div className="item-title">
                                        <h3>{item.workDescription}</h3>
                                        <span className="issue-id">Issue: {item.issueId || item.issue_id}</span>
                                    </div>
                                </div>
                                
                                <div className="item-details">
                                    <div className="detail-row">
                                        <span className="detail-label">Worker:</span>
                                        <span className="detail-value">{item.workerName}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Completed:</span>
                                        <span className="detail-value">
                                            {new Date(item.completionDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Cost:</span>
                                        <span className="detail-value cost">{formatCurrency(item.cost)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Status:</span>
                                        <span className={`detail-value status ${getStatusBadgeClass(item.status)}`}>{item.status}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payment Action */}
                {getTotalAmount() > 0 && (
                    <div className="payment-action-section">
                        <div className="payment-total">
                            <span className="total-label">Total Amount Due:</span>
                            <span className="total-amount">{formatCurrency(getTotalAmount())}</span>
                        </div>
                        
                        <button 
                            className={`pay-now-btn ${paymentProcessing ? 'processing' : ''}`}
                            onClick={handlePayNow}
                            disabled={paymentProcessing || getTotalAmount() === 0}
                        >
                            {paymentProcessing ? (
                                <>
                                    <div className="btn-spinner"></div>
                                    Processing Payouts...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-credit-card"></i>
                                    Send Payouts
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </AnimatedBackground>
    );
}

export default AdminPayment;