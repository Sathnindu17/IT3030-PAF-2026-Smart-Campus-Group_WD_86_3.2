import { useEffect, useMemo, useState } from "react";
import { bookingsAPI } from "../../api/axios";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const [rejectModal, setRejectModal] = useState({
    open: false,
    id: null,
    reason: "",
  });

  useEffect(() => {
    fetchBookings();
  }, [filter, dateFilter]);

  const fetchBookings = async () => {
    setLoading(true);

    try {
      const params = {};
      if (filter) params.status = filter;
      if (dateFilter) params.date = dateFilter;

      const res = await bookingsAPI.getAllBookings(params);
      setBookings(res?.data?.data || []);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const analytics = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === "PENDING").length;
    const approved = bookings.filter((b) => b.status === "APPROVED").length;
    const rejected = bookings.filter((b) => b.status === "REJECTED").length;
    const cancelled = bookings.filter((b) => b.status === "CANCELLED").length;

    const resourceCount = {};
    bookings.forEach((b) => {
      const name = b.resourceName || "Unknown Resource";
      resourceCount[name] = (resourceCount[name] || 0) + 1;
    });

    const topResource =
      Object.entries(resourceCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

    return {
      total,
      pending,
      approved,
      rejected,
      cancelled,
      topResource,
    };
  }, [bookings]);

  const handleApprove = async (id) => {
    try {
      await bookingsAPI.approve(id);
      fetchBookings();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to approve booking");
    }
  };

  const handleReject = async () => {
    if (!rejectModal.reason.trim()) {
      alert("Please enter rejection reason");
      return;
    }

    try {
      await bookingsAPI.reject(rejectModal.id, rejectModal.reason.trim());
      setRejectModal({ open: false, id: null, reason: "" });
      fetchBookings();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to reject booking");
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div> Loading bookings...
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Review Bookings (Admin)</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "14px",
          marginBottom: "20px",
        }}
      >
        <div className="card">
          <div className="card-body">
            <p>Total Bookings</p>
            <h2>{analytics.total}</h2>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <p>Pending</p>
            <h2>{analytics.pending}</h2>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <p>Approved</p>
            <h2>{analytics.approved}</h2>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <p>Rejected</p>
            <h2>{analytics.rejected}</h2>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <p>Top Resource</p>
            <h3>{analytics.topResource}</h3>
          </div>
        </div>
      </div>

      <div className="filters" style={{ display: "flex", gap: "12px" }}>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />

        {(filter || dateFilter) && (
          <button
            className="btn btn-secondary"
            onClick={() => {
              setFilter("");
              setDateFilter("");
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {bookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <p>No bookings found</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Resource</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Purpose</th>
                  <th>Attendees</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td>{b.userName || "Unknown User"}</td>
                    <td>
                      <strong>{b.resourceName || "Unknown Resource"}</strong>
                    </td>
                    <td>{b.date}</td>
                    <td>
                      {b.startTime} - {b.endTime}
                    </td>
                    <td>{b.purpose}</td>
                    <td>{b.expectedAttendees}</td>
                    <td>
                      <span className={`badge badge-${b.status?.toLowerCase()}`}>
                        {b.status}
                      </span>
                    </td>
                    <td>
                      {b.status === "REJECTED"
                        ? b.rejectionReason || "No reason provided"
                        : "-"}
                    </td>
                    <td>
                      {b.status === "PENDING" ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => handleApprove(b.id)}
                            className="btn btn-sm btn-success"
                          >
                            Approve
                          </button>

                          <button
                            onClick={() =>
                              setRejectModal({
                                open: true,
                                id: b.id,
                                reason: "",
                              })
                            }
                            className="btn btn-sm btn-danger"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {rejectModal.open && (
        <div
          className="modal-overlay"
          onClick={() =>
            setRejectModal({ open: false, id: null, reason: "" })
          }
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reject Booking</h3>
              <button
                className="modal-close"
                onClick={() =>
                  setRejectModal({ open: false, id: null, reason: "" })
                }
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Reason for rejection</label>
                <textarea
                  className="form-control"
                  value={rejectModal.reason}
                  onChange={(e) =>
                    setRejectModal({
                      ...rejectModal,
                      reason: e.target.value,
                    })
                  }
                  placeholder="Provide a reason..."
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() =>
                  setRejectModal({ open: false, id: null, reason: "" })
                }
                className="btn btn-secondary"
              >
                Cancel
              </button>

              <button onClick={handleReject} className="btn btn-danger">
                Reject Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}