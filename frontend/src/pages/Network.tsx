import { useEffect, useState } from "react";
import { connectionAPI } from "../api/connection.api";
import { Connection, User } from "../types";
import "./Network.css";

export default function Network() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [requests, setRequests] = useState<Connection[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<"connections" | "requests" | "suggestions">("connections");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [connectionsData, requestsData, suggestionsData] = await Promise.all([
        connectionAPI.getConnections(),
        connectionAPI.getPendingRequests(),
        connectionAPI.getSuggestions(),
      ]);
      setConnections(connectionsData);
      setRequests(requestsData);
      setSuggestions(suggestionsData);
    } catch (error) {
      console.error("Load network error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (connectionId: string) => {
    try {
      await connectionAPI.acceptConnection(connectionId);
      loadData();
    } catch (error) {
      console.error("Accept error:", error);
    }
  };

  const handleReject = async (connectionId: string) => {
    try {
      await connectionAPI.rejectConnection(connectionId);
      loadData();
    } catch (error) {
      console.error("Reject error:", error);
    }
  };

  const handleConnect = async (userId: string) => {
    try {
      await connectionAPI.sendRequest(userId);
      loadData();
    } catch (error) {
      console.error("Connect error:", error);
    }
  };

  if (loading) {
    return <div className="network-loading">Loading network...</div>;
  }

  return (
    <div className="network-page">
      <div className="network-header">
        <h1>My Network</h1>
        <div className="network-stats">
          <div className="stat">
            <span className="stat-value">{connections.length}</span>
            <span className="stat-label">Connections</span>
          </div>
          <div className="stat">
            <span className="stat-value">{requests.length}</span>
            <span className="stat-label">Requests</span>
          </div>
        </div>
      </div>

      <div className="network-tabs">
        <button
          className={`tab ${activeTab === "connections" ? "active" : ""}`}
          onClick={() => setActiveTab("connections")}
        >
          Connections ({connections.length})
        </button>
        <button
          className={`tab ${activeTab === "requests" ? "active" : ""}`}
          onClick={() => setActiveTab("requests")}
        >
          Requests ({requests.length})
        </button>
        <button
          className={`tab ${activeTab === "suggestions" ? "active" : ""}`}
          onClick={() => setActiveTab("suggestions")}
        >
          Suggestions ({suggestions.length})
        </button>
      </div>

      <div className="network-content">
        {activeTab === "connections" && (
          <div className="connections-grid">
            {connections.map((conn: any) => (
              <div key={conn._id} className="connection-card">
                <div className="connection-avatar">
                  {conn.connection.name.charAt(0).toUpperCase()}
                </div>
                <h3>{conn.connection.name}</h3>
                <p className="connection-headline">{conn.connection.headline || "Professional"}</p>
                <p className="connection-location">{conn.connection.location}</p>
                <button className="btn-message">Message</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "requests" && (
          <div className="requests-list">
            {requests.map((request) => (
              <div key={request._id} className="request-card">
                <div className="request-avatar">
                  {request.requester.name.charAt(0).toUpperCase()}
                </div>
                <div className="request-info">
                  <h3>{request.requester.name}</h3>
                  <p>{request.requester.headline || "Professional"}</p>
                  {request.message && <p className="request-message">"{request.message}"</p>}
                </div>
                <div className="request-actions">
                  <button className="btn-accept" onClick={() => handleAccept(request._id)}>
                    Accept
                  </button>
                  <button className="btn-reject" onClick={() => handleReject(request._id)}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "suggestions" && (
          <div className="suggestions-grid">
            {suggestions.map((user) => (
              <div key={user._id} className="suggestion-card">
                <div className="suggestion-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <h3>{user.name}</h3>
                <p className="suggestion-headline">{user.headline || "Professional"}</p>
                <p className="suggestion-location">{user.location}</p>
                <button className="btn-connect" onClick={() => handleConnect(user._id)}>
                  Connect
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
