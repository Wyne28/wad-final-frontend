import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../context/user-context";
import { api } from "../lib/api";

export default function Courses() {
  const { user } = useContext(UserContext);
  const isTeacher = user.role === "Teacher";

  const [courses, setCourses] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [enrolledOnly, setEnrolledOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCourses() {
      setLoading(true);
      setError("");

      const query = new URLSearchParams();

      if (search) query.set("search", search);
      if (!isTeacher && enrolledOnly) query.set("enrolled", "true");

      try {
        const data = await api(`/api/course?${query}`, {
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setCourses(data.courses);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadCourses();

    return () => controller.abort();
  }, [search, enrolledOnly, isTeacher, refresh]);

  function handleSearch(event) {
    event.preventDefault();
    setMessage("");
    setSearch(searchInput.trim());
    setRefresh((value) => value + 1);
  }

  async function handleDelete(course) {
    if (!window.confirm(`Delete "${course.name}" permanently?`)) {
      return;
    }

    setError("");
    setMessage("");
    setDeletingId(course._id);

    try {
      await api(`/api/course/${course._id}`, {
        method: "DELETE",
      });

      setMessage("Course deleted successfully.");
      setRefresh((value) => value + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">
            {isTeacher ? "My Courses" : "Explore Courses"}
          </h1>
          <p className="page-subtitle">
            {isTeacher
              ? "Create and manage your courses."
              : "Find a course and take your next step."}
          </p>
        </div>

        {isTeacher && (
          <Link className="btn btn-primary" to="/courses/new">
            Create Course
          </Link>
        )}
      </header>

      <div className="toolbar">
        {!isTeacher && (
          <div className="tabs" role="group" aria-label="Course list">
            <button
              type="button"
              className={`tab ${!enrolledOnly ? "active" : ""}`}
              aria-pressed={!enrolledOnly}
              onClick={() => {
                setEnrolledOnly(false);
                setMessage("");
              }}
            >
              All Courses
            </button>

            <button
              type="button"
              className={`tab ${enrolledOnly ? "active" : ""}`}
              aria-pressed={enrolledOnly}
              onClick={() => {
                setEnrolledOnly(true);
                setMessage("");
              }}
            >
              My Courses
            </button>
          </div>
        )}

        <form className="search-form" onSubmit={handleSearch}>
          <input
            className="form-control"
            aria-label="Search by course or Teacher name"
            placeholder="Search course or Teacher name"
            maxLength={100}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />

          <button className="btn btn-primary" type="submit">
            Search
          </button>
        </form>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="alert alert-success" role="status">
          {message}
        </div>
      )}

      {loading ? (
        <div className="loading" role="status">
          Loading courses...
        </div>
      ) : error ? (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setRefresh((value) => value + 1)}
        >
          Retry
        </button>
      ) : courses.length === 0 ? (
        <div className="card empty-state">
          {enrolledOnly
            ? "No enrolled courses match your search."
            : "No courses found."}
        </div>
      ) : (
        <div className="course-grid">
          {courses.map((course) => (
            <article className="card course-card" key={course._id}>
              <span
                className={`badge badge-${course.status.toLowerCase()}`}
              >
                {course.status}
              </span>

              <h2>{course.name}</h2>

              <div className="course-meta">
                <span>
                  Teacher: {course.teacher?.username || "Unavailable"}
                </span>
                <span>Duration: {course.durationDays} days</span>
                <span>
                  Students: {course.enrolledCount} / {course.maxStudents}
                </span>
                <span>Available seats: {course.remainingSeats}</span>
              </div>

              <p className="course-price">
                Price: {Number(course.price).toLocaleString()}
              </p>

              {!isTeacher && course.isEnrolled && (
                <span className="badge badge-open">Enrolled</span>
              )}

              <div className="card-actions">
                <Link
                  className="btn btn-secondary"
                  to={`/courses/${course._id}`}
                >
                  View Details
                </Link>

                {isTeacher && (
                  <>
                    <Link
                      className="btn btn-secondary"
                      to={`/courses/${course._id}/edit`}
                    >
                      Edit
                    </Link>

                    <button
                      type="button"
                      className="btn btn-danger"
                      disabled={
                        deletingId !== null || course.enrolledCount > 0
                      }
                      title={
                        course.enrolledCount > 0
                          ? "Courses with enrolled Students cannot be deleted"
                          : "Delete course"
                      }
                      onClick={() => handleDelete(course)}
                    >
                      {deletingId === course._id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}