import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Slideshow images
  const slides = [
    {
      title: 'Modern Campus Infrastructure',
      description: 'Manage your campus facilities with intelligent resource allocation and real-time availability tracking.',
      image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1400&q=80',
    },
    {
      title: 'Smart Learning Spaces',
      description: 'From libraries to labs, coordinate all your educational spaces efficiently and effectively.',
      image: 'https://images.unsplash.com/photo-1497633762265-25c6bdc50f6a?auto=format&fit=crop&w=1400&q=80',
    },
    {
      title: 'Connected Education',
      description: 'Seamlessly integrate ticketing, bookings, and notifications for a unified campus experience.',
      image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1400&q=80',
    },
  ];

  // Auto-advance slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds
    return () => clearInterval(interval);
  }, [slides.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };
  const highlights = [
    {
      title: 'Business Courses',
      icon: '💼',
      text: 'Plan classrooms, bookings, and resources for fast-moving academic programs.',
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80'
    },
    {
      title: 'Travel & Tourism',
      icon: '✈️',
      text: 'Coordinate campus transport, events, and shared facilities in one place.',
      image: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=900&q=80'
    },
    {
      title: 'Fashion Courses',
      icon: '🎓',
      text: 'Support labs, studio rooms, and equipment requests with a modern workflow.',
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80'
    },
  ];

  const featureTiles = [
    {
      title: 'Facilities Management',
      text: 'Track halls, labs, and equipment with clean approvals and live visibility.',
      image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80'
    },
    {
      title: 'Smart Bookings',
      text: 'Reserve rooms and resources with conflict checks and status updates.',
      image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=900&q=80'
    },
    {
      title: 'Incident Tickets',
      text: 'Report issues quickly and keep technicians, admins, and users aligned.',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80'
    },
  ];

  return (
    <div className="landing landing-university">
      <div className="landing-announcement-bar">
        <span>Join with us and be part of the success</span>
        <div className="landing-socials">
          <span>f</span>
          <span>x</span>
          <span>g+</span>
          <span>in</span>
        </div>
      </div>

      <header className="landing-top-strip">
        <Link to="/" className="landing-brand landing-brand-link" aria-label="Go to home page">
          <div className="landing-brand-mark">🏫</div>
          <div>
            <div className="landing-brand-name">Smart Campus Hub</div>
            <div className="landing-brand-subtitle">University operations platform</div>
          </div>
        </Link>

        <div className="landing-contact-grid">
          <div className="landing-contact-item">
            <span className="landing-contact-icon">☎</span>
            <div>
              <div className="landing-contact-label">CALL US</div>
              <div className="landing-contact-value">+1 (213) 471-7207</div>
            </div>
          </div>
          <div className="landing-contact-item">
            <span className="landing-contact-icon">✉</span>
            <div>
              <div className="landing-contact-label">EMAIL US</div>
              <div className="landing-contact-value">support@smartcampus.local</div>
            </div>
          </div>
          <div className="landing-contact-item">
            <span className="landing-contact-icon">📍</span>
            <div>
              <div className="landing-contact-label">LOCATE US</div>
              <div className="landing-contact-value">210 Wells Fargo Drive, Houston</div>
            </div>
          </div>
        </div>
      </header>

      <nav className="landing-nav landing-nav-bar">
        <div className="landing-nav-links">
          <Link to="/app/dashboard">Dashboard</Link>
          <Link to="/app/resources">Resources</Link>
          <Link to="/app/bookings/my">Bookings</Link>
          <Link to="/app/tickets/my">Tickets</Link>
          <Link to="/app/notifications">Notifications</Link>
          <Link to="/app/notifications/preferences">Settings</Link>
        </div>

        <div className="landing-nav-actions">
          {!isAuthenticated && (
            <Link to="/login" className="btn btn-secondary landing-ghost-btn">Sign In</Link>
          )}
          <Link to="/app/dashboard" className="btn btn-primary landing-solid-btn">Go to Dashboard</Link>
        </div>
      </nav>

      <section className="landing-hero-shell" style={{ position: "relative", overflow: "hidden" }}>
        {/* SLIDESHOW BACKGROUND */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
        }}>
          {slides.map((slide, index) => (
            <div
              key={index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('${slide.image}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity: currentSlide === index ? 1 : 0,
                transition: "opacity 0.8s ease-in-out",
              }}
            />
          ))}
        </div>

        {/* Navigation Controls */}
        {/* Previous Button */}
        <button
          onClick={goToPrevious}
          style={{
            position: "absolute",
            left: "30px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 20,
            background: "rgba(255, 255, 255, 0.2)",
            border: "none",
            color: "#fff",
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            cursor: "pointer",
            fontSize: "28px",
            fontWeight: "bold",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(255, 255, 255, 0.35)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(255, 255, 255, 0.2)";
          }}
          aria-label="Previous slide"
        >
          ‹
        </button>

        {/* Next Button */}
        <button
          onClick={goToNext}
          style={{
            position: "absolute",
            right: "30px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 20,
            background: "rgba(255, 255, 255, 0.2)",
            border: "none",
            color: "#fff",
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            cursor: "pointer",
            fontSize: "28px",
            fontWeight: "bold",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(255, 255, 255, 0.35)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(255, 255, 255, 0.2)";
          }}
          aria-label="Next slide"
        >
          ›
        </button>

        {/* Dots Navigation */}
        <div style={{
          position: "absolute",
          bottom: "30px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 20,
          display: "flex",
          gap: "10px",
        }}>
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              style={{
                width: currentSlide === index ? "32px" : "8px",
                height: "8px",
                borderRadius: "4px",
                border: "none",
                background: currentSlide === index 
                  ? "linear-gradient(90deg, #0ea5e9, #4f46e5)"
                  : "rgba(255, 255, 255, 0.4)",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Slide Counter */}
        <div style={{
          position: "absolute",
          top: "30px",
          right: "30px",
          zIndex: 20,
          background: "rgba(0, 0, 0, 0.5)",
          color: "#fff",
          padding: "8px 16px",
          borderRadius: "20px",
          fontSize: "12px",
          fontWeight: 600,
          backdropFilter: "blur(4px)",
        }}>
          {currentSlide + 1} / {slides.length}
        </div>

        {/* HERO CONTENT ON TOP */}
        <div style={{ position: "relative", zIndex: 10 }}>
          <div className="landing-hero-overlay" />
          <div className="landing-hero-content">
            <div className="landing-kicker">Do you need any help?</div>
            <h1>Welcome to our university</h1>
            <p>
              A modern operations hub for resources, bookings, ticketing, and notifications.
              Keep every campus workflow in one place.
            </p>
            <div className="landing-hero-actions">
              <Link to="/app/dashboard" className="btn btn-primary landing-solid-btn">Read More</Link>
              {!isAuthenticated && (
                <Link to="/login" className="btn btn-secondary landing-ghost-btn">Sign In</Link>
              )}
            </div>
          </div>

          <div className="landing-highlight-row">
            {highlights.map((item) => (
              <article key={item.title} className="landing-highlight-card">
                <span className="landing-highlight-icon">{item.icon}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-feature-grid">
        {featureTiles.map((item) => (
          <article key={item.title} className="landing-feature-card">
            <div
              className="landing-feature-image"
              style={{ backgroundImage: `linear-gradient(180deg, rgba(8, 16, 37, 0.1), rgba(8, 16, 37, 0.45)), url('${item.image}')` }}
            />
            <div className="landing-feature-body">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <Link to="/app/dashboard" className="landing-feature-link">
                Learn More →
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
