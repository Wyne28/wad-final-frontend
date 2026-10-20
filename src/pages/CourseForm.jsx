import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";

const emptyForm = {
  name: "",
  durationDays: "",
  topics: "",
  price: "",
  maxStudents: "",
  status: "Open",
};

export default function CourseForm() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(courseId);

  const [form, setForm] = useState({ ...emptyForm });
  const [loading, setLoading] = useState(isEditing);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [enrolledCount, setEnrolledCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCourse() {
      setLoadError("");
      setError("");

      if (!courseId) {
        setForm({ ...emptyForm });
        setEnrolledCount(0);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const data = await api(`/api/course/${courseId}`, {
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          const course = data.course;

          setForm({
            name: course.name,
            durationDays: String(course.durationDays),
            topics: course.topics.join("\n"),
            price: String(course.price),
            maxStudents: String(course.maxStudents),
            status: course.status,
          });

          setEnrolledCount(course.enrolledCount);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setLoadError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadCourse();

    return () => controller.abort();
  }, [courseId]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const topics = [
      ...new Set(
        form.topics
          .split("\n")
          .map((topic) => topic.trim())
          .filter(Boolean),
      ),
    ];

    const durationDays = Number(form.durationDays);
    const price = Number(form.price);
    const maxStudents = Number(form.maxStudents);

    if (!form.name.trim() || form.name.trim().length > 150) {
      setError("Course name must contain 1 to 150 characters.");
      return;
    }

    if (!Number.isSafeInteger(durationDays) || durationDays < 1) {
      setError("Duration must be a positive whole number.");
      return;
    }

    if (
      topics.length === 0 ||
      topics.length > 50 ||
      topics.some((topic) => topic.length > 200)
    ) {
      setError(
        "Provide 1 to 50 topics, each containing 1 to 200 characters.",
      );
      return;
    }

    if (form.price.trim() === "" || !Number.isFinite(price) || price < 0) {
      setError("Price must be a nonnegative number.");
      return;
    }

    if (!Number.isSafeInteger(maxStudents) || maxStudents < 1) {
      setError("Max Students must be a positive whole number.");
      return;
    }

    if (maxStudents < enrolledCount) {
      setError(
        `Max Students cannot be lower than ${enrolledCount}, the current enrollment count.`,
      );
      return;
    }

    setSaving(true);

    try {
      const data = await api(
        isEditing ? `/api/course/${courseId}` : "/api/course",
        {
          method: isEditing ? "PATCH" : "POST",
          body: JSON.stringify({
            name: form.name.trim(),
            durationDays,
            topics,
            price,
            maxStudents,
            status: form.status,
          }),
        },
      );

      navigate(`/courses/${data.course._id}`, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="loading" role="status">
        Loading course...
      </div>
    );
  }

  if (loadError) {
    return (
      <>
        <div className="alert alert-error" role="alert">
          {loadError}
        </div>

        <Link className="btn btn-secondary" to="/courses">
          Back to Courses
        </Link>
      </>
    );
  }

  return (
    <section className="card form-card">
      <header className="page-header">
        <div>
          <h1 className="page-title">
            {isEditing ? "Edit Course" : "Create Course"}
          </h1>
          <p className="page-subtitle">
            {isEditing
              ? "Update your course information."
              : "Share your knowledge with Students."}
          </p>
        </div>
      </header>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Course Name</label>
          <input
            id="name"
            name="name"
            className="form-control"
            value={form.name}
            onChange={handleChange}
            maxLength={150}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="durationDays">Duration (days)</label>
            <input
              id="durationDays"
              name="durationDays"
              className="form-control"
              type="number"
              min="1"
              step="1"
              value={form.durationDays}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="price">Price</label>
            <input
              id="price"
              name="price"
              className="form-control"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="topics">Topics</label>
          <textarea
            id="topics"
            name="topics"
            className="form-control"
            value={form.topics}
            onChange={handleChange}
            placeholder={"Grammar\nReading\nSpeaking"}
            aria-describedby="topics-help"
            required
          />
          <span id="topics-help" className="form-help">
            Enter one topic per line.
          </span>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="maxStudents">Max Students</label>
            <input
              id="maxStudents"
              name="maxStudents"
              className="form-control"
              type="number"
              min={Math.max(1, enrolledCount)}
              step="1"
              value={form.maxStudents}
              onChange={handleChange}
              required
            />
            {isEditing && (
              <span className="form-help">
                Currently enrolled: {enrolledCount}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              className="form-control"
              value={form.status}
              onChange={handleChange}
              required
            >
              <option value="Open">Open</option>
              <option value="Close">Close</option>
              <option value="Cancel">Cancel</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button
            className="btn btn-primary"
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Create Course"}
          </button>

          <Link
            className="btn btn-secondary"
            to={isEditing ? `/courses/${courseId}` : "/courses"}
          >
            Back
          </Link>
        </div>
      </form>
    </section>
  );
}