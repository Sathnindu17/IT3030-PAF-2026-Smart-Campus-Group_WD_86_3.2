import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { bookingsAPI, resourcesAPI } from "../../api/axios";

export default function BookingForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const CUSTOM_RESOURCE = "CUSTOM_RESOURCE";
  const preselectedResource = searchParams.get("resourceId") || "";

  const today = new Date().toISOString().split("T")[0];

  const [resources, setResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [resourcesError, setResourcesError] = useState("");

  const [form, setForm] = useState({
    resourceId: preselectedResource,
    resourceName: "",
    date: "",
    startTime: "",
    endTime: "",
    purpose: "",
    expectedAttendees: 1,
  });

  const [availability, setAvailability] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const isCustomResource = form.resourceId === CUSTOM_RESOURCE;

  const selectedResource = useMemo(() => {
    return resources.find(
      (resource) => String(resource.id || resource._id) === String(form.resourceId)
    );
  }, [resources, form.resourceId]);

  useEffect(() => {
    const fetchResources = async () => {
      setResourcesLoading(true);
      setResourcesError("");

      try {
        const res = await resourcesAPI.getAll({ status: "ACTIVE" });

        const payload = res?.data;
        const resourceList =
          payload?.data ||
          payload?.content ||
          payload?.resources ||
          payload ||
          [];

        if (!Array.isArray(resourceList)) {
          throw new Error("Invalid resources response");
        }

        setResources(resourceList);
      } catch (err) {
        console.error("Failed to load resources:", err);
        setResources([]);
        setResourcesError(
          err?.response?.data?.message ||
          "Failed to load resources. Please check backend authorization."
        );
      } finally {
        setResourcesLoading(false);
      }
    };

    fetchResources();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkAvailability();
    }, 500);

    return () => clearTimeout(timer);
  }, [form.resourceId, form.resourceName, form.date, form.startTime, form.endTime]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setAvailability(null);
    setError("");

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "expectedAttendees"
          ? Math.max(1, parseInt(value, 10) || 1)
          : value,
    }));
  };

  const validateForm = () => {
    if (!form.resourceId) return "Please select a resource.";

    if (isCustomResource && !form.resourceName.trim()) {
      return "Please enter custom resource name.";
    }

    if (!form.date) return "Please select a date.";

    if (form.date < today) {
      return "Booking date cannot be before today.";
    }

    if (!form.startTime || !form.endTime) {
      return "Please select start time and end time.";
    }

    if (form.endTime <= form.startTime) {
      return "End time must be after start time.";
    }

    if (!form.purpose.trim()) return "Purpose is required.";

    if (Number(form.expectedAttendees) < 1) {
      return "Expected attendees must be at least 1.";
    }

    if (availability && availability.available === false) {
      return "Selected time slot is already booked.";
    }

    return "";
  };

  const checkAvailability = async () => {
    if (!form.resourceId) return;
    if (isCustomResource && !form.resourceName.trim()) return;
    if (!form.date || !form.startTime || !form.endTime) return;
    if (form.date < today) return;
    if (form.endTime <= form.startTime) return;

    try {
      setCheckingAvailability(true);

      const params = {
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
      };

      if (isCustomResource) {
        params.resourceName = form.resourceName.trim();
      } else {
        params.resourceId = form.resourceId;
      }

      const res = await bookingsAPI.checkAvailability(params);
      const data = res?.data?.data || res?.data;

      setAvailability({
        available: Boolean(data.available),
        message:
          data.message ||
          (data.available
            ? "This time slot is available"
            : "This time slot is already booked"),
      });
    } catch (err) {
      setAvailability({
        available: false,
        message:
          err?.response?.data?.message ||
          "Could not check availability for this time slot",
      });
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        resourceId: isCustomResource ? null : form.resourceId,
        resourceName: isCustomResource
          ? form.resourceName.trim()
          : selectedResource?.name,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        purpose: form.purpose.trim(),
        expectedAttendees: Number(form.expectedAttendees),
      };

      await bookingsAPI.create(payload);

      setSuccess("Booking request submitted! Waiting for admin approval.");

      setTimeout(() => {
        navigate("/app/bookings/my");
      }, 1200);
    } catch (err) {
      console.error("Booking create failed:", err);
      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to create booking"
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedResourceName = isCustomResource
    ? form.resourceName
    : selectedResource?.name;

  const selectedResourceType = isCustomResource
    ? "Custom Resource"
    : selectedResource?.type?.replace(/_/g, " ");

  const selectedResourceLocation = isCustomResource
    ? "User entered"
    : selectedResource?.location;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div
        style={{
          background:
            "linear-gradient(135deg, rgb(79, 70, 229), rgb(124, 58, 237))",
          color: "#fff",
          padding: "16px 22px",
          borderRadius: "16px",
          marginBottom: "20px",
          boxShadow: "0 8px 22px rgba(79, 70, 229, 0.22)",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1.55rem", fontWeight: 800 }}>
          New Booking Request
        </h2>
        <p style={{ marginTop: "8px", marginBottom: 0, fontSize: "0.98rem" }}>
          Reserve campus resources with validation, availability checking, and a clear summary.
        </p>
      </div>

      {resourcesError && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          {resourcesError}
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          {success}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "20px",
        }}
      >
        <div className="card">
          <div className="card-body">
            <h3 style={{ marginTop: 0, marginBottom: "20px" }}>
              Booking Details
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Resource</label>
                <select
                  name="resourceId"
                  className="form-control"
                  value={form.resourceId}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    {resourcesLoading ? "Loading resources..." : "Select a resource"}
                  </option>

                  {resources.map((r) => {
                    const id = r.id || r._id;
                    return (
                      <option key={id} value={id}>
                        {r.name} ({String(r.type || "").replace(/_/g, " ")}) -{" "}
                        {r.location}
                      </option>
                    );
                  })}

                  <option value={CUSTOM_RESOURCE}>
                    Other / Add my own resource
                  </option>
                </select>
              </div>

              {isCustomResource && (
                <div className="form-group">
                  <label>Enter Resource Name</label>
                  <input
                    type="text"
                    name="resourceName"
                    className="form-control"
                    value={form.resourceName}
                    onChange={handleChange}
                    placeholder="Example: Main Building Smart Classroom"
                    required
                  />
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    name="date"
                    className="form-control"
                    value={form.date}
                    min={today}
                    onChange={handleChange}
                    required
                  />
                  <small style={{ color: "#6b7280" }}>
                    Past dates are not allowed.
                  </small>
                </div>

                <div className="form-group">
                  <label>Expected Attendees</label>
                  <input
                    type="number"
                    name="expectedAttendees"
                    min="1"
                    className="form-control"
                    value={form.expectedAttendees}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    name="startTime"
                    className="form-control"
                    value={form.startTime}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    name="endTime"
                    className="form-control"
                    value={form.endTime}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {checkingAvailability && (
                <div
                  style={{
                    marginBottom: "14px",
                    padding: "10px",
                    borderRadius: "8px",
                    background: "#f3f4f6",
                    color: "#374151",
                    fontWeight: 600,
                  }}
                >
                  Checking availability...
                </div>
              )}

              {availability && !checkingAvailability && (
                <div
                  style={{
                    marginBottom: "14px",
                    padding: "10px",
                    borderRadius: "8px",
                    background: availability.available ? "#ecfdf5" : "#fef2f2",
                    color: availability.available ? "#047857" : "#b91c1c",
                    border: availability.available
                      ? "1px solid #a7f3d0"
                      : "1px solid #fecaca",
                    fontWeight: 700,
                  }}
                >
                  {availability.available ? "✅ " : "❌ "}
                  {availability.message}
                </div>
              )}

              <div className="form-group">
                <label>Purpose</label>
                <textarea
                  name="purpose"
                  className="form-control"
                  value={form.purpose}
                  onChange={handleChange}
                  required
                  rows="4"
                  placeholder="Describe the purpose of this booking"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={
                  loading ||
                  checkingAvailability ||
                  (availability && availability.available === false)
                }
              >
                {loading ? "Submitting..." : "Submit Booking Request"}
              </button>
            </form>
          </div>
        </div>

        <div className="card" style={{ height: "fit-content" }}>
          <div className="card-body">
            <h3 style={{ marginTop: 0, marginBottom: "20px" }}>
              Booking Summary
            </h3>

            <p>
              <strong>Resource:</strong> {selectedResourceName || "-"}
            </p>
            <p>
              <strong>Type:</strong> {selectedResourceType || "-"}
            </p>
            <p>
              <strong>Location:</strong> {selectedResourceLocation || "-"}
            </p>
            <p>
              <strong>Date:</strong> {form.date || "-"}
            </p>
            <p>
              <strong>Time:</strong>{" "}
              {form.startTime && form.endTime
                ? `${form.startTime} to ${form.endTime}`
                : "-"}
            </p>
            <p>
              <strong>Attendees:</strong> {form.expectedAttendees || 1}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}