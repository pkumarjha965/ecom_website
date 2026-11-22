import React, { useEffect, useState } from "react";
import type { TrackingResponse } from "../types";
import { validatePayment, fetchTrackingByPayment, fetchTrackingByOrder, advanceTrackingStage } from "../services/api";

interface OrderConfirmationProps {
  sessionId: string;
  orderIdParam?: string;
  onContinueShopping: () => void;
}

export const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  sessionId,
  orderIdParam,
  onContinueShopping,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [paymentValid, setPaymentValid] = useState<boolean>(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [shipment, setShipment] = useState<TrackingResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState<boolean>(false);
  const [showLabelModal, setShowLabelModal] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function verifyAndLoadTracking() {
      try {
        setLoading(true);
        setErrorMsg(null);

        // 1. Validate Payment with Quarkus & Stripe
        const paymentRes = await validatePayment(sessionId);
        if (!isMounted) return;

        setPaymentValid(paymentRes.paid || paymentRes.status === "PAID");
        setPaymentDetails(paymentRes);

        // 2. Fetch associated Sandbox Shipment
        let shipmentRes: TrackingResponse | null = null;
        try {
          shipmentRes = await fetchTrackingByPayment(sessionId);
        } catch (e) {
          if (orderIdParam) {
            try {
              shipmentRes = await fetchTrackingByOrder(orderIdParam);
            } catch (err) {
              console.warn("Could not retrieve shipment yet:", err);
            }
          }
        }

        if (isMounted && shipmentRes) {
          setShipment(shipmentRes);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error("Order verification error:", err);
        setErrorMsg(err.message || "Failed to verify payment");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    verifyAndLoadTracking();

    return () => {
      isMounted = false;
    };
  }, [sessionId, orderIdParam]);

  const handleAdvanceStatus = async () => {
    if (!shipment) return;
    setAdvancing(true);
    try {
      const updated = await advanceTrackingStage(shipment.trackingNumber);
      setShipment(updated);
    } catch (err: any) {
      alert("Could not advance shipment: " + err.message);
    } finally {
      setAdvancing(false);
    }
  };

  const steps = [
    { key: "ORDER_PLACED", label: "Order Placed" },
    { key: "LABEL_CREATED", label: "Label Created" },
    { key: "IN_TRANSIT", label: "In Transit" },
    { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
    { key: "DELIVERED", label: "Delivered" },
  ];

  const getStepIndex = (status?: string) => {
    switch (status) {
      case "ORDER_PLACED": return 0;
      case "LABEL_CREATED": return 1;
      case "IN_TRANSIT": return 2;
      case "OUT_FOR_DELIVERY": return 3;
      case "DELIVERED": return 4;
      default: return 1;
    }
  };

  const currentStep = getStepIndex(shipment?.status);

  return (
    <div className="confirmation-page">
      <div className="confirmation-card">
        {loading ? (
          <div className="confirmation-loading">
            <div className="spinner"></div>
            <h3>Verifying Payment with Stripe & Creating Shipment...</h3>
            <p>Please wait while your transaction and logistics are confirmed.</p>
          </div>
        ) : errorMsg ? (
          <div className="confirmation-error">
            <span className="icon">⚠️</span>
            <h3>Validation Issue</h3>
            <p>{errorMsg}</p>
            <button className="btn-primary" onClick={onContinueShopping}>Return to Store</button>
          </div>
        ) : (
          <div className="confirmation-content">
            {/* Payment Header */}
            <div className="success-header">
              <div className="success-icon">✓</div>
              <h2>Payment Successful!</h2>
              <p>Thank you for your purchase with ElectroVault.</p>
              <div className="order-meta-pill">
                <span>Order: {orderIdParam || "N/A"}</span>
                <span>•</span>
                <span>Status: {paymentValid ? "PAID" : "CONFIRMED"}</span>
                {paymentDetails?.amount && (
                  <>
                    <span>•</span>
                    <span>Paid: ${(paymentDetails.amount / 100).toFixed(2)}</span>
                  </>
                )}
                <span>•</span>
                <span>Session: {sessionId.substring(0, 14)}...</span>
              </div>
            </div>

            {/* Shipment Sandbox Card */}
            {shipment ? (
              <div className="shipment-tracker-card">
                <div className="tracker-header">
                  <div>
                    <span className="tracker-sub">SANDBOX SHIPPING DISPATCH</span>
                    <h3>Carrier: {shipment.carrier}</h3>
                    <div className="tracking-number-badge">
                      <span>Tracking #: {shipment.trackingNumber}</span>
                    </div>
                  </div>
                  <div className="tracker-actions">
                    <button
                      className="btn-label"
                      onClick={() => setShowLabelModal(true)}
                    >
                      🏷️ View Shipping Label
                    </button>
                  </div>
                </div>

                {/* Progress Stepper */}
                <div className="stepper-container">
                  {steps.map((st, idx) => {
                    const isCompleted = idx <= currentStep;
                    const isCurrent = idx === currentStep;
                    return (
                      <div key={st.key} className={`step-item ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""}`}>
                        <div className="step-circle">{isCompleted ? "✓" : idx + 1}</div>
                        <span className="step-label">{st.label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Sandbox Stage Control */}
                <div className="sandbox-control-bar">
                  <div className="sandbox-note">
                    <span className="badge-tag">SANDBOX MODE</span>
                    <span>Test real-time webhook updates by simulating parcel movement.</span>
                  </div>
                  <button
                    className="advance-btn"
                    disabled={advancing || shipment.status === "DELIVERED"}
                    onClick={handleAdvanceStatus}
                  >
                    {advancing ? "Updating..." : shipment.status === "DELIVERED" ? "Package Delivered 🎉" : "Advance Status ⏩"}
                  </button>
                </div>

                {/* Checkpoint Timeline */}
                <div className="checkpoints-history">
                  <h4>Tracking Checkpoints</h4>
                  <div className="timeline-list">
                    {shipment.checkpoints.map((cp, i) => (
                      <div key={i} className="timeline-item">
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
              </div>
            ) : (
              <div className="shipment-pending">
                <p>Shipment record is being registered in the background.</p>
              </div>
            )}

            <div className="confirmation-footer">
              <button className="btn-primary" onClick={onContinueShopping}>
                ← Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Printable Label Modal */}
      {showLabelModal && shipment && (
        <div className="label-modal-overlay" onClick={() => setShowLabelModal(false)}>
          <div className="label-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="label-modal-header">
              <h3>Airway Bill / Shipping Label</h3>
              <button className="close-btn" onClick={() => setShowLabelModal(false)}>✕</button>
            </div>
            <div className="label-preview">
              <img
                src={`http://localhost:8080${shipment.labelUrl}`}
                alt="Shipping Label"
                className="label-svg-img"
              />
            </div>
            <div className="label-modal-footer">
              <button className="btn-secondary" onClick={() => window.print()}>
                🖨️ Print Label
              </button>
              <button className="btn-primary" onClick={() => setShowLabelModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
