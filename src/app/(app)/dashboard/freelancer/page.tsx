"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { getMyContracts, getMyNotifications, markNotificationRead } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import { ApiError } from "@/lib/http-client";
import type { ContractResponse, NotificationResponse } from "@/lib/types";

export default function FreelancerDashboardPage() {
  const { session } = useAuth();
  const isFreelancer = session?.role === "FREELANCER";

  const [contracts, setContracts] = useState<ContractResponse[]>([]);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [markingNotificationId, setMarkingNotificationId] = useState<number | null>(null);

  const refreshDashboard = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [contractData, notificationData] = await Promise.all([getMyContracts(), getMyNotifications()]);
      setContracts(contractData);
      setNotifications(notificationData);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Could not load freelancer dashboard.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshDashboard();
  }, [refreshDashboard]);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);

  const handleMarkAsRead = async (notificationId: number) => {
    setMarkingNotificationId(notificationId);
    setErrorMessage(null);
    try {
      await markNotificationRead(notificationId);
      await refreshDashboard();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Could not mark notification as read.");
      }
    } finally {
      setMarkingNotificationId(null);
    }
  };

  if (!isFreelancer) {
    return (
      <section className="surface-card">
        <h1 className="section-title">Freelancer dashboard</h1>
        <p className="error-text">This page is available only for FREELANCER accounts.</p>
      </section>
    );
  }

  return (
    <div className="surface-grid">
      <section className="surface-card">
        <h1 className="section-title">Freelancer Dashboard</h1>
        <div className="row-actions">
          <button type="button" className="btn-secondary" onClick={() => void refreshDashboard()} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh dashboard"}
          </button>
          <span className="pill">{contracts.length} contracts</span>
          <span className="pill">{unreadCount} unread notifications</span>
        </div>
        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
      </section>

      <div className="split-2">
        <section className="surface-card">
          <h2 className="section-title">My Contracts</h2>
          <div className="job-list">
            {contracts.map((contract) => (
              <article key={contract.id} className="job-item">
                <div className="row-actions row-between">
                  <strong>Contract #{contract.id}</strong>
                  <span className="pill">{contract.status}</span>
                </div>
                <p className="muted-text">Job #{contract.jobId}</p>
                <p className="muted-text mb-sm">Updated: {formatDate(contract.updatedAt)}</p>
                {contract.milestones?.length ? (
                  <ul className="list-compact">
                    {contract.milestones.map((milestone) => (
                      <li key={milestone.id}>
                        {milestone.title} - {formatMoney(milestone.amount)} ({milestone.status})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted-text">No milestones yet.</p>
                )}
              </article>
            ))}
            {!contracts.length ? <p className="muted-text">No contracts available.</p> : null}
          </div>
        </section>

        <section className="surface-card">
          <h2 className="section-title">Notifications</h2>
          <div className="job-list">
            {notifications.map((notification) => (
              <article key={notification.id} className="job-item">
                <div className="row-actions row-between">
                  <strong>{notification.title}</strong>
                  <span className="pill">{notification.type}</span>
                </div>
                <p className="muted-text mb-sm">{notification.message}</p>
                <div className="row-actions">
                  <span className="muted-text">Created: {formatDate(notification.createdAt)}</span>
                  {!notification.read ? (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => void handleMarkAsRead(notification.id)}
                      disabled={markingNotificationId !== null}
                    >
                      {markingNotificationId === notification.id ? "Updating..." : "Mark as read"}
                    </button>
                  ) : (
                    <span className="pill">Read</span>
                  )}
                </div>
              </article>
            ))}
            {!notifications.length ? <p className="muted-text">No notifications yet.</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
