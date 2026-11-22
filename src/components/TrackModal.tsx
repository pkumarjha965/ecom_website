import React, { useState } from "react";
import type { TrackingResponse } from "../types";
import { fetchTracking, fetchTrackingByOrder, advanceTrackingStage } from "../services/api";

interface TrackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrackModal: React.FC<TrackModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState<string>("");
  const [shipment, setShipment] = useState<TrackingResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setShipment(null);

    try {
      let res: TrackingResponse | null = null;
      if (query.trim().toUpperCase().startsWith("ORD-")) {
        res = await fetchTrackingByOrder(query.trim());
      } else {
        res = await fetchTracking(query.trim());
      }
      setShipment(res);
    } catch (err: any) {
      setErrorMsg(err.message || "Tracking number or order not found");
    } finally {
      setLoading(false);
    }
  };

  const handleAdvance = async () => {
    if (!shipment) return;
    setAdvancing(true);
    try {
      const updated = await advanceTrackingStage(shipment.trackingNumber);
      setShipment(updated);
    } catch (err: any) {
      alert("Could not advance tracking: " + err.message);
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <div className="label-modal-overlay" onClick={onClose}>
      <div className="track-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="label-modal-header">
          <h3>📦 Sandbox Shipment Tracker</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSearch} className="track-search-form">
          <input
            type="text"
            placeholder="Enter Tracking # (e.g. USPS-...) or Order # (e.g. ORD-...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Searching..." : "Track"}
          </button>
        </form>

        {errorMsg && <div className="error-banner">⚠️ {errorMsg}</div>}

        {shipment && (
          <div className="track-result-box">
            <div className="tracker-header">
              <div>
                <span className="tracker-sub">{shipment.carrier} • {shipment.shippingMethod.toUpperCase()}</span>
                <h4>{shipment.trackingNumber}</h4>
                <p>Destination: {shipment.destination}</p>
              </div>
              <div className="status-badge-current">{shipment.status.replace("_", " ")}</div>
            </div>

            <div className="sandbox-control-bar" style={{ marginTop: "16px" }}>
              <span className="badge-tag">SANDBOX</span>
              <button
                className="advance-btn"
                disabled={advancing || shipment.status === "DELIVERED"}
                onClick={handleAdvance}
              >
                {advancing ? "Advancing..." : shipment.status === "DELIVERED" ? "Delivered" : "Simulate Next Checkpoint ⏩"}
              </button>
            </div>

            <div className="timeline-list" style={{ marginTop: "16px", maxHeight: "200px", overflowY: "auto" }}>
              {shipment.checkpoints.map((cp, idx) => (
                <div key={idx} className="timeline-item">
                  <div className="timeline-bullet"></div>
                  <div className="timeline-content">
                    <div className="timeline-title-row">
                      <strong>{cp.status.replace("_", " ")}</strong>
                      <span className="timeline-time">
                        {new Date(cp.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p>{cp.description}</p>
                    <span className="timeline-loc">📍 {cp.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
