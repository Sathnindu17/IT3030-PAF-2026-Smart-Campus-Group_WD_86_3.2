import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { bookingsAPI, resourcesAPI } from "../../api/axios";

export default function BookingForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const preselectedResource = searchParams.get("resourceId") || "";

  const [resources, setResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [resourcesError, setResourcesError] = useState("");

  const [form, setForm] = useState({
    resourceId: preselectedResource,
    date: "",
    startTime: "",
    endTime: "",
    purpose: "",
    expectedAttendees: 1,
  });

  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

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

        // Support common API shapes
        const payload = res?.data;
        const resourceList =
          payload?.data ||
          payload?.content ||
          payload?.resources ||
          payload ||
          [];

        if (!Array.isArray(resourceList)) {
          throw new Error("Invalid resources response from server");
        }

        setResources(resourceList);

        // If preselectedResource exists but not found in DB, clear it
        if (
          preselectedResource &&
          !resourceList.some(
            (r) => String(r.id || r._id) === String(preselectedResource)
          )
        ) {
          setForm((prev) => ({ ...prev, resourceId: "" }));
        }
      } catch (err) {
        console.error("Failed to load resources:", err);

        const message =
          err?.response?.status === 403
            ? "You are not allowed to load resources. Please fix backend authorization for GET /api/resources."
            : err?.response?.data?.message ||
            err?.message ||
            "Failed to load resources";

        setResources([]);
        setResourcesError(message);
      } finally {
        setResourcesLoading(false);
      }
    };

    fetchResources();
  }, [preselectedResource]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "expectedAttendees"
          ? Math.max(1, parseInt(value, 10) || 1)
          : value,
    }));
  };

  const validateForm = () => {
    if (!form.resourceId) {
      return "Please select a resource.";
    }
    if (!form.date) {
      return "Please select a date.";
    }
    if (!form.startTime || !form.endTime) {
      return "Please select both start time and end time.";
    }
    if (form.endTime <= form.startTime) {
      return "End time must be after start time.";
    }
    if (!form.purpose.trim()) {
      return "Purpose is required.";
    }
    if (form.expectedAttendees < 1) {
      return "Expected attendees must be at least 1.";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitError("");
    setSuccess("");

    const validationError = validateForm();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        resourceId: form.resourceId,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        purpose: form.purpose.trim(),
        expectedAttendees: Number(form.expectedAttendees),
      };

      await bookingsAPI.create(payload);

      setSuccess("Booking request submitted successfully. Waiting for admin approval.");

      setTimeout(() => {
        navigate("/app/bookings/my");
      }, 1200);
    } catch (err) {
      console.error("Booking create failed:", err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to create booking";

      setSubmitError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div
        style={{
          background: "linear-gradient(135deg, rgb(79, 70, 229), rgb(124, 58, 237))",
          color: "#fff",
          padding: "24px",
          borderRadius: "20px",
          marginBottom: "24px",
          boxShadow: "0 12px 30px rgba(79, 70, 229, 0.25)",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "2rem", fontWeight: 800 }}>
          New Booking Request
        </h2>
        <p style={{ marginTop: "12px", marginBottom: 0, fontSize: "1.1rem" }}>
          Reserve campus resources quickly with validation, availability checking,
          and a clear booking summary.
        </p>
      </div>

      {resourcesError && (
        <div
          style={{
            marginBottom: "16px",
            background: "rgb(254, 242, 242)",
            color: "rgb(185, 28, 28)",
            border: "1px solid rgb(254, 202, 202)",
            padding: "14px 16px",
            borderRadius: "12px",
            fontWeight: 500,
          }}
        >
          {resourcesError}
        </div>
      )}

      {submitError && (
        <div
          style={{
            marginBottom: "16px",
            background: "#fff4f4",
            color: "#c62828",
            border: "1px solid #f3b7b7",
            padding: "12px 14px",
            borderRadius: "10px",
          }}
        >
          {submitError}
        </div>
      )}

      {success && (
        <div
          style={{
            marginBottom: "16px",
            background: "#f1fff4",
            color: "#1b7a31",
            border: "1px solid #b7e3c0",
            padding: "12px 14px",
            borderRadius: "10px",
          }}
        >
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
        <div
          style={{
            background: "#fff",
            borderRadius: "18px",
            padding: "24px",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "20px" }}>Booking Details</h3>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
                Resource
              </label>
              <select
                name="resourceId"
                value={form.resourceId}
                onChange={handleChange}
                required
                disabled={resourcesLoading || !!resourcesError}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  border: "1px solid #d1d5db",
                  fontSize: "1rem",
                }}
              >
                <option value="">
                  {resourcesLoading ? "Loading resources..." : "Select a resource"}
                </option>

                {resources.map((r) => {
                  const id = r.id || r._id;
                  return (
                    <option key={id} value={id}>
                      {r.name} ({String(r.type || "").replace(/_/g, " ")}) - {r.location}
                    </option>
                  );
                })}
              </select>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1px solid #d1d5db",
                    fontSize: "1rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
                  Expected Attendees
                </label>
                <input
                  type="number"
                  name="expectedAttendees"
                  min="1"
                  value={form.expectedAttendees}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1px solid #d1d5db",
                    fontSize: "1rem",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
                  Start Time
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={form.startTime}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1px solid #d1d5db",
                    fontSize: "1rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
                  End Time
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={form.endTime}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1px solid #d1d5db",
                    fontSize: "1rem",
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
                Purpose
              </label>
              <textarea
                name="purpose"
                value={form.purpose}
                onChange={handleChange}
                required
                rows="4"
                placeholder="Describe the purpose of this booking"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  border: "1px solid #d1d5db",
                  fontSize: "1rem",
                  resize: "vertical",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || resourcesLoading || !!resourcesError}
              style={{
                background: loading ? "#9ca3af" : "#4f46e5",
                color: "#fff",
                border: "none",
                padding: "12px 18px",
                borderRadius: "12px",
                fontSize: "1rem",
                fontWeight: 700,
                cursor:
                  loading || resourcesLoading || !!resourcesError
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {loading ? "Submitting..." : "Submit Booking Request"}
            </button>
          </form>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: "18px",
            padding: "24px",
            border: "1px solid #e5e7eb",
            height: "fit-content",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "20px" }}>Booking Summary</h3>

          <p><strong>Resource:</strong> {selectedResource?.name || "-"}</p>
          <p><strong>Type:</strong> {selectedResource?.type?.replace(/_/g, " ") || "-"}</p>
          <p><strong>Location:</strong> {selectedResource?.location || "-"}</p>
          <p><strong>Date:</strong> {form.date || "-"}</p>
          <p>
            <strong>Time:</strong>{" "}
            {form.startTime && form.endTime
              ? `${form.startTime} to ${form.endTime}`
              : "-"}
          </p>
          <p><strong>Attendees:</strong> {form.expectedAttendees || 1}</p>
        </div>
      </div>
    </div>
  );
}