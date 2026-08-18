import React from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  Code2,
  Zap,
  Shield,
  Users,
  Book,
  Github,
  Target,
  Rocket,
  Calendar,
  CheckCircle,
} from "lucide-react";
import type { Route } from "./+types/about";
import { Navigation } from "~/components/navigation/navigation";
import styles from "./about.module.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "About SimBa - Hybrid Python/Rust Programming Language" },
    {
      name: "description",
      content:
        "Learn about SimBa, a revolutionary hybrid programming language that combines Python's ease-of-use with Rust's performance and safety features. Discover its purpose, capabilities, and future roadmap.",
    },
  ];
}

export default function About() {
  return (
    <div className={styles.container}>
      <Navigation />

      <main className={styles.main}>
        <div className={styles.content}>
          <header className={styles.header}>
            <h1 className={styles.title}>
              About SimBa
              <span className="beta-badge">Beta</span>
            </h1>
            <p className={styles.subtitle}>
              A revolutionary hybrid programming language combining Python's ease-of-use with Rust's performance and
              safety.
            </p>
          </header>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>What is SimBa?</h2>
            <p className={styles.text}>
              SimBa is an innovative hybrid programming language that bridges the gap between Python's
              developer-friendly syntax and Rust's system-level performance. It allows developers to write expressive,
              readable code while benefiting from memory safety guarantees and near-native execution speed.
            </p>
            <p className={styles.text}>
              By combining the best aspects of both languages, SimBa enables developers to build high-performance
              applications without sacrificing code clarity or safety. Our language features Python's familiar syntax
              with Rust's ownership model, creating a unique development experience that's both powerful and accessible.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Why SimBa? Purpose & Market Position</h2>
            <p className={styles.text}>
              The programming language landscape has long forced developers to choose between ease of development and
              runtime performance. Python offers rapid development and readable code but suffers from performance
              limitations. Rust provides blazing speed and memory safety but comes with a steep learning curve.
            </p>
            <p className={styles.text}>SimBa fills this critical gap by offering:</p>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <strong>Familiar Syntax:</strong> Python-like readability that reduces onboarding time for existing
                developers
              </li>
              <li className={styles.listItem}>
                <strong>Performance Without Compromise:</strong> Rust-level execution speed with compile-time
                optimizations
              </li>
              <li className={styles.listItem}>
                <strong>Memory Safety:</strong> Prevent common bugs like null pointer dereferences and buffer overflows
              </li>
              <li className={styles.listItem}>
                <strong>Ecosystem Integration:</strong> Seamless interoperability with existing Python and Rust
                codebases
              </li>
              <li className={styles.listItem}>
                <strong>Modern Development:</strong> Built-in concurrency, async/await, and modern language features
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Key Capabilities</h2>
            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <Code2 />
                </div>
                <h3 className={styles.featureTitle}>Expressive Syntax</h3>
                <p className={styles.featureText}>
                  Write clean, readable code using Python's familiar indentation-based syntax with enhanced type
                  annotations.
                </p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <Zap />
                </div>
                <h3 className={styles.featureTitle}>High Performance</h3>
                <p className={styles.featureText}>
                  Compile to efficient machine code with zero-cost abstractions and aggressive optimizations for maximum
                  speed.
                </p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <Shield />
                </div>
                <h3 className={styles.featureTitle}>Memory Safety</h3>
                <p className={styles.featureText}>
                  Prevent common programming errors through compile-time checks and Rust's ownership model integration.
                </p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <Users />
                </div>
                <h3 className={styles.featureTitle}>Safe Concurrency</h3>
                <p className={styles.featureText}>
                  Build concurrent applications without data races, featuring true parallelism without Python's GIL
                  limitations.
                </p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <Book />
                </div>
                <h3 className={styles.featureTitle}>Cross-Language Interop</h3>
                <p className={styles.featureText}>
                  Seamlessly integrate with Python libraries and Rust crates, leveraging existing ecosystems.
                </p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <Target />
                </div>
                <h3 className={styles.featureTitle}>Modern Tooling</h3>
                <p className={styles.featureText}>
                  Integrated package management, testing framework, and development tools for a complete programming
                  experience.
                </p>
              </div>
            </div>

            <div className={styles.capabilitiesSection}>
              <h3 className={styles.subsectionTitle}>Application Types SimBa Excels At:</h3>
              <div className={styles.applicationTypes}>
                <div className={styles.appTypeCard}>
                  <h4>System Utilities</h4>
                  <p>Command-line tools, file processors, and system administration scripts with native performance.</p>
                </div>
                <div className={styles.appTypeCard}>
                  <h4>Web Services</h4>
                  <p>High-performance APIs, microservices, and backend applications with async capabilities.</p>
                </div>
                <div className={styles.appTypeCard}>
                  <h4>Data Processing</h4>
                  <p>ETL pipelines, data analysis tools, and scientific computing applications.</p>
                </div>
                <div className={styles.appTypeCard}>
                  <h4>Embedded Systems</h4>
                  <p>IoT devices, embedded controllers, and resource-constrained environments.</p>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>SimBa vs. The World</h2>

            <div className={styles.comparisonSection}>
              <h3 className={styles.subsectionTitle}>SimBa vs. Python</h3>
              <div className={styles.comparisonGrid}>
                <div className={styles.comparisonCard}>
                  <h4>Similarities</h4>
                  <ul>
                    <li>Indentation-based syntax</li>
                    <li>Dynamic-feeling development experience</li>
                    <li>Extensive library ecosystem access</li>
                    <li>Readable, expressive code</li>
                  </ul>
                </div>
                <div className={styles.comparisonCard}>
                  <h4>SimBa Advantages</h4>
                  <ul>
                    <li>10-100x faster execution</li>
                    <li>Compile-time error detection</li>
                    <li>Memory safety guarantees</li>
                    <li>True parallelism (no GIL)</li>
                    <li>Zero-cost abstractions</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className={styles.comparisonSection}>
              <h3 className={styles.subsectionTitle}>SimBa vs. Rust</h3>
              <div className={styles.comparisonGrid}>
                <div className={styles.comparisonCard}>
                  <h4>Shared Benefits</h4>
                  <ul>
                    <li>Memory safety without garbage collection</li>
                    <li>Zero-cost abstractions</li>
                    <li>Excellent performance</li>
                    <li>Modern concurrency model</li>
                  </ul>
                </div>
                <div className={styles.comparisonCard}>
                  <h4>SimBa Advantages</h4>
                  <ul>
                    <li>Gentler learning curve</li>
                    <li>Python-like syntax familiarity</li>
                    <li>Faster development iteration</li>
                    <li>Built-in Python interoperability</li>
                    <li>More approachable for beginners</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className={styles.comparisonSection}>
              <h3 className={styles.subsectionTitle}>Compared to Other Languages</h3>
              <div className={styles.otherLanguages}>
                <div className={styles.languageComparison}>
                  <h4>vs. Go</h4>
                  <p>
                    SimBa offers stronger type safety and memory management while maintaining similar performance and
                    concurrency capabilities.
                  </p>
                </div>
                <div className={styles.languageComparison}>
                  <h4>vs. C++</h4>
                  <p>
                    SimBa provides memory safety by default and modern syntax while achieving comparable performance for
                    most applications.
                  </p>
                </div>
                <div className={styles.languageComparison}>
                  <h4>vs. Java</h4>
                  <p>
                    SimBa eliminates garbage collection overhead and offers more direct system access while maintaining
                    type safety.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>SimBa Development Roadmap</h2>
            <p className={styles.text}>
              Our journey from concept to production-ready language follows a carefully planned roadmap, with each phase
              building upon the previous to create a robust, community-driven programming language.
            </p>

            <div className={styles.roadmap}>
              <div className={styles.roadmapPhase}>
                <div className={styles.phaseHeader}>
                  <CheckCircle className={styles.phaseIcon} />
                  <h3 className={styles.phaseTitle}>Phase 1: Conceptualization</h3>
                  <span className={styles.phaseStatus}>Completed</span>
                </div>
                <div className={styles.phaseContent}>
                  <p>
                    Initial idea exploration and language design. Research into hybrid language possibilities and core
                    feature planning.
                  </p>
                </div>
              </div>

              <div className={styles.roadmapPhase}>
                <div className={styles.phaseHeader}>
                  <CheckCircle className={styles.phaseIcon} />
                  <h3 className={styles.phaseTitle}>Phase 2: Core Development</h3>
                  <span className={styles.phaseStatus}>Completed</span>
                </div>
                <div className={styles.phaseContent}>
                  <p>
                    Implementation of basic language features including string operations, mathematical computations,
                    and fundamental syntax.
                  </p>
                </div>
              </div>

              <div className={styles.roadmapPhase}>
                <div className={styles.phaseHeader}>
                  <CheckCircle className={styles.phaseIcon} />
                  <h3 className={styles.phaseTitle}>Phase 3: Feature Expansion</h3>
                  <span className={styles.phaseStatus}>Completed</span>
                </div>
                <div className={styles.phaseContent}>
                  <p>
                    Addition of advanced features, bug fixes, and language refinements. Implementation of core hybrid
                    capabilities.
                  </p>
                </div>
              </div>

              <div className={styles.roadmapPhase}>
                <div className={styles.phaseHeader}>
                  <CheckCircle className={styles.phaseIcon} />
                  <h3 className={styles.phaseTitle}>Phase 4: Platform Launch</h3>
                  <span className={styles.phaseStatus}>Completed</span>
                </div>
                <div className={styles.phaseContent}>
                  <p>
                    Creation of the SimBa website and documentation to introduce the project to the developer community.
                  </p>
                </div>
              </div>

              <div className={styles.roadmapPhase}>
                <div className={styles.phaseHeader}>
                  <Rocket className={styles.phaseIcon} />
                  <h3 className={styles.phaseTitle}>Phase 5: Interactive Learning (Current)</h3>
                  <span className={styles.phaseStatus}>In Progress</span>
                </div>
                <div className={styles.phaseContent}>
                  <p>
                    Development of the interactive playground and comprehensive programming guide. Implementation of
                    invite-only beta access and waitlist system.
                  </p>
                </div>
              </div>

              <div className={styles.roadmapPhase}>
                <div className={styles.phaseHeader}>
                  <Calendar className={styles.phaseIcon} />
                  <h3 className={styles.phaseTitle}>Phase 6: Community Funding</h3>
                  <span className={styles.phaseStatus}>Planned</span>
                </div>
                <div className={styles.phaseContent}>
                  <p>
                    Introduction of donation platform and community funding mechanisms. Implementation of donor rewards
                    and project sponsorship options.
                  </p>
                </div>
              </div>

              <div className={styles.roadmapPhase}>
                <div className={styles.phaseHeader}>
                  <Calendar className={styles.phaseIcon} />
                  <h3 className={styles.phaseTitle}>Phase 7: Production Preparation</h3>
                  <span className={styles.phaseStatus}>Planned</span>
                </div>
                <div className={styles.phaseContent}>
                  <p>
                    Extensive feature development and bug fixes in preparation for the first public release. Transition
                    from beta to stable version.
                  </p>
                </div>
              </div>

              <div className={styles.roadmapPhase}>
                <div className={styles.phaseHeader}>
                  <Calendar className={styles.phaseIcon} />
                  <h3 className={styles.phaseTitle}>Phase 8: Local Development</h3>
                  <span className={styles.phaseStatus}>Planned</span>
                </div>
                <div className={styles.phaseContent}>
                  <p>
                    Release of downloadable SimBa compiler and development tools. Comprehensive setup guides for local
                    development environments.
                  </p>
                </div>
              </div>

              <div className={styles.roadmapPhase}>
                <div className={styles.phaseHeader}>
                  <Calendar className={styles.phaseIcon} />
                  <h3 className={styles.phaseTitle}>Phase 9: Open Access</h3>
                  <span className={styles.phaseStatus}>Planned</span>
                </div>
                <div className={styles.phaseContent}>
                  <p>
                    Transition to open signup for the playground. Removal of invite-only restrictions while maintaining
                    quality community standards.
                  </p>
                </div>
              </div>

              <div className={styles.roadmapPhase}>
                <div className={styles.phaseHeader}>
                  <Calendar className={styles.phaseIcon} />
                  <h3 className={styles.phaseTitle}>Phase 10: Ecosystem Development</h3>
                  <span className={styles.phaseStatus}>Future</span>
                </div>
                <div className={styles.phaseContent}>
                  <p>
                    Development of in-house package management, standard library expansion, and advanced import systems.
                  </p>
                </div>
              </div>

              <div className={styles.roadmapPhase}>
                <div className={styles.phaseHeader}>
                  <Calendar className={styles.phaseIcon} />
                  <h3 className={styles.phaseTitle}>Phase 11: AI Integration</h3>
                  <span className={styles.phaseStatus}>Future</span>
                </div>
                <div className={styles.phaseContent}>
                  <p>
                    Integration of AI-powered development tools and language features. Support for AI application
                    development and AI-assisted programming.
                  </p>
                </div>
              </div>

              <div className={styles.roadmapPhase}>
                <div className={styles.phaseHeader}>
                  <Calendar className={styles.phaseIcon} />
                  <h3 className={styles.phaseTitle}>Phase 12: Advanced Applications</h3>
                  <span className={styles.phaseStatus}>Future</span>
                </div>
                <div className={styles.phaseContent}>
                  <p>
                    Expansion into operating system development, web framework creation, game development, and other
                    complex application domains.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Getting Started</h2>
            <p className={styles.text}>
              Ready to try SimBa? Our interactive playground lets you experiment with the language features and see how
              SimBa code compiles and executes. Join our beta community and help shape the future of hybrid programming.
            </p>
            <div className={styles.ctaButtons}>
              <Link to="/signup" className={styles.primaryButton}>
                Join Beta Program
              </Link>
              <Link to="/guide" className={styles.secondaryButton}>
                Read Programming Guide
              </Link>
              <Link to="/" className={styles.secondaryButton}>
                <ArrowLeft className={styles.buttonIcon} />
                Back to Home
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
