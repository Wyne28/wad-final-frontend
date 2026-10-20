import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { UserContext } from "../context/user-context";
import { api } from "../lib/api";

export default function CourseDetails() {
  const { courseId } = useParams();
  const { user } = useContext(UserContext);

  const isTeacher = user.role === "Teacher";

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCourse() {
      setLoading(true);
      setError("");
      setCourse(null);

      try {
        const data = await api(`/api/course/${courseId}`, {
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setCourse(data.course);
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

    loadCourse();

    return () => controller.abort();
  }, [courseId, refresh]);

  async function handleEnroll() {
    setEnrolling(true);
    setError("");
    setMessage("");

    try {
      await api(`/api/course/${courseId}/enroll`, {
        method: "POST",
      });

      setMessage("You have successfully enrolled in this course.");

      setCourse((current) => ({
        ...current,
        isEnrolled: true,
        enrolledCount: current.enrolledCount + 1,
        remainingSeats: Math.max(0, current.remainingSeats - 1),
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) {
    return (
      <div className="loading" role="status">
        Loading course...
      </div>
    );
  }

  if (!course) {
    return (
      <>
        <Link className="btn btn-secondary" to="/courses">
          Back to Courses
        </Link>

        <div className="alert alert-error" role="alert">
          {error || "Course unavailable."}
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setRefresh((value) => value + 1)}
        >
          Retry
        </button>
      </>
    );
  }

  const canEnroll =
    !isTeacher &&
    !course.isEnrolled &&
    course.status === "Open" &&
    course.remainingSeats > 0;

  let enrollmentLabel = "Enroll Now";

  if (course.isEnrolled) {
    enrollmentLabel = "Already Enrolled";
  } else if (course.status !== "Open") {
    enrollmentLabel = "Enrollment Closed";
  } else if (course.remainingSeats < 1) {
    enrollmentLabel = "Course Full";
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">{course.name}</h1>
          <p className="page-subtitle">
            Teacher: {course.teacher?.username || "Unavailable"}
          </p>
        </div>

        <Link className="btn btn-secondary" to="/courses">
          Back to Courses
        </Link>
      </header>

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

      <section className="card">
        <span className={`badge badge-${course.status.toLowerCase()}`}>
          {course.status}
        </span>

        <div className="details-grid">
          <div>
            <div className="detail-label">Duration</div>
            <div className="detail-value">
              {course.durationDays} days
            </div>
          </div>

          <div>
            <div className="detail-label">Price</div>
            <div className="detail-value">
              {Number(course.price).toLocaleString()}
            </div>
          </div>

          <div>
            <div className="detail-label">Enrolled Students</div>
            <div className="detail-value">
              {course.enrolledCount} / {course.maxStudents}
            </div>
          </div>

          <div>
            <div className="detail-label">Available Seats</div>
            <div className="detail-value">{course.remainingSeats}</div>
          </div>
        </div>

        <h2>Topics</h2>

        <ul className="topic-list">
          {course.topics.map((topic) => (
            <li className="topic" key={topic}>
              {topic}
            </li>
          ))}
        </ul>

        <div className="form-actions">
          {isTeacher ? (
            <Link
              className="btn btn-primary"
              to={`/courses/${courseId}/edit`}
            >
              Edit Course
            </Link>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canEnroll || enrolling}
              onClick={handleEnroll}
            >
              {enrolling ? "Enrolling..." : enrollmentLabel}
            </button>
          )}
        </div>
      </section>

      {isTeacher && (
        <section className="card" style={{ marginTop: 24 }}>
          <h2>Enrolled Students</h2>

          {!course.students?.length ? (
            <p className="page-subtitle">No Students enrolled yet.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <caption className="form-help">
                  Students enrolled in {course.name}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Username</th>
                    <th scope="col">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {course.students.map((student) => (
                    <tr key={student._id}>
                      <td>{student.username}</td>
                      <td>{student.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}