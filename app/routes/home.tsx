import { Link } from "react-router";
import {
  Code2,
  Zap,
  Shield,
  Rocket,
  ArrowRight,
  Gauge,
  Users,
  GitMerge,
  Layers,
  Heart,
  DollarSign,
  Target,
  BookOpen,
  Play,
  Download,
} from "lucide-react";
import type { Route } from "./+types/home";
import { Navigation } from "~/components/navigation/navigation";
import styles from "./home.module.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "SimBa - Interactive Hybrid Programming Platform" },
    {
      name: "description",
      content:
        "Learn and experiment with SimBa, the hybrid programming language that combines Python's simplicity with Rust's performance. Interactive playground, comprehensive guides, and community-driven development.",
    },
  ];
}

export default function Home() {
  return (
    <div className={styles.container}>
      <Navigation />

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Unlock Your Creativity with <span className={styles.highlight}>Hybrid Programming</span>
              <span className="beta-badge">Beta</span>
            </h1>
            <p className={styles.heroDescription}>
              Experience the future of programming with our interactive platform. Build, test, and learn SimBa - the
              revolutionary hybrid language that bridges Python and Rust. Seamlessly write, execute, and manage projects
              in a unified environment designed for modern developers.
            </p>
            <div className={styles.heroActions}>
              <Link to="/signup" className={styles.primaryButton}>
                Start Building
                <ArrowRight className={styles.buttonIcon} />
              </Link>
              <Link to="/about" className={styles.secondaryButton}>
                Discover SimBa
              </Link>
            </div>
          </div>
          <div className={styles.heroImage}>
            <div className={styles.codePreview}>
              <div className={styles.codeHeader}>
                <span className={styles.codeTitle}>hello.smba</span>
              </div>
              <pre className={styles.codeContent}>
                {`# SimBa: Python syntax, Rust performance
def fibonacci(n: int) -> int:
    if n <= 1:
        return n

    return fibonacci(n - 1) + fibonacci(n - 2)

# Rust-like memory safety
let buffer = SafeBuffer::new(10)
buffer.push(fibonacci(20))

print(f"Result: {buffer.get(0)}")`}
              </pre>
            </div>
          </div>
        </section>

        <section className={styles.platform}>
          <div className={styles.platformHeader}>
            <h2 className={styles.platformTitle}>
              Why Our <span className={styles.highlight}>Platform</span> Exists
            </h2>
            <p className={styles.platformSubtitle}>
              We're building more than just a language - we're creating an ecosystem for hybrid programming education
              and experimentation
            </p>
          </div>

          <div className={styles.platformGrid}>
            <div className={styles.platformCard}>
              <div className={styles.platformIcon}>
                <Play />
              </div>
              <h3 className={styles.platformCardTitle}>Interactive Learning</h3>
              <p className={styles.platformCardDescription}>
                Learn hybrid programming concepts through hands-on experimentation in our browser-based playground. No
                setup required - start coding immediately with real-time feedback.
              </p>
            </div>

            <div className={styles.platformCard}>
              <div className={styles.platformIcon}>
                <Users />
              </div>
              <h3 className={styles.platformCardTitle}>Community-Driven</h3>
              <p className={styles.platformCardDescription}>
                Join a growing community of developers exploring the future of programming languages. Share projects,
                learn from others, and contribute to SimBa's evolution.
              </p>
            </div>

            <div className={styles.platformCard}>
              <div className={styles.platformIcon}>
                <Rocket />
              </div>
              <h3 className={styles.platformCardTitle}>Innovation Hub</h3>
              <p className={styles.platformCardDescription}>
                Experiment with cutting-edge language features that bridge the gap between different programming
                paradigms. Shape the future of hybrid programming.
              </p>
            </div>

            <div className={styles.platformCard}>
              <div className={styles.platformIcon}>
                <BookOpen />
              </div>
              <h3 className={styles.platformCardTitle}>Comprehensive Guides</h3>
              <p className={styles.platformCardDescription}>
                Master SimBa with our complete programming guide, from basic syntax to advanced interoperability with
                Python and Rust ecosystems.
              </p>
            </div>

            <div className={styles.platformCard}>
              <div className={styles.platformIcon}>
                <GitMerge />
              </div>
              <h3 className={styles.platformCardTitle}>Cross-Language Compatibility</h3>
              <p className={styles.platformCardDescription}>
                Import and export between SimBa, Python, and Rust files seamlessly. Build on existing codebases and
                integrate with your favorite tools.
              </p>
            </div>

            <div className={styles.platformCard}>
              <div className={styles.platformIcon}>
                <Shield />
              </div>
              <h3 className={styles.platformCardTitle}>Safe Experimentation</h3>
              <p className={styles.platformCardDescription}>
                Learn memory management and type safety concepts in a controlled environment. Make mistakes safely while
                building real understanding.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.comparison}>
          <div className={styles.comparisonHeader}>
            <h2 className={styles.comparisonTitle}>
              Why Choose <span className={styles.highlight}>SimBa</span>?
            </h2>
            <p className={styles.comparisonSubtitle}>
              See how SimBa combines the best of Python and Rust to create the perfect hybrid language
            </p>
          </div>

          <div className={styles.comparisonGrid}>
            <div className={styles.languageCard}>
              <div className={styles.languageHeader}>
                <div className={styles.languageIcon}>
                  <Users />
                </div>
                <h3 className={styles.languageName}>Python</h3>
              </div>
              <p className={styles.languageTagline}>"Simple and readable"</p>

              <div className={styles.comparisonSection}>
                <h4 className={styles.sectionTitle}>Performance</h4>
                <div className={styles.performanceBar}>
                  <div className={`${styles.performanceFill} ${styles.python}`}></div>
                </div>
                <p className={styles.performanceLabel}>Interpreted • Baseline speed</p>
              </div>

              <div className={styles.comparisonSection}>
                <h4 className={styles.sectionTitle}>Characteristics</h4>
                <div className={styles.sectionContent}>
                  <ul>
                    <li>Dynamic typing</li>
                    <li>Garbage collection</li>
                    <li>Global Interpreter Lock (GIL)</li>
                    <li>Indentation-based syntax</li>
                  </ul>
                </div>
              </div>

              <div className={styles.comparisonSection}>
                <h4 className={styles.sectionTitle}>Best For</h4>
                <div className={styles.sectionContent}>
                  <ul>
                    <li>Rapid prototyping</li>
                    <li>Data science & ML</li>
                    <li>Web development</li>
                    <li>Scripting & automation</li>
                  </ul>
                </div>
              </div>

              <div className={styles.comparisonSection}>
                <h4 className={styles.sectionTitle}>Limitations</h4>
                <div className={styles.sectionContent}>
                  <ul>
                    <li>Slower execution speed</li>
                    <li>Limited concurrency</li>
                    <li>Runtime type errors</li>
                    <li>Memory overhead</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className={`${styles.languageCard} ${styles.simba}`}>
              <div className={styles.languageHeader}>
                <div className={styles.languageIcon}>
                  <Code2 />
                </div>
                <h3 className={styles.languageName}>
                  SimBa
                  <span className="beta-badge">Beta</span>
                </h3>
              </div>
              <p className={styles.languageTagline}>"Best of both worlds"</p>

              <div className={styles.comparisonSection}>
                <h4 className={styles.sectionTitle}>Performance</h4>
                <div className={styles.performanceBar}>
                  <div className={`${styles.performanceFill} ${styles.simba}`}></div>
                </div>
                <p className={styles.performanceLabel}>Compiled • Near-native speed</p>
              </div>

              <div className={styles.comparisonSection}>
                <h4 className={styles.sectionTitle}>Characteristics</h4>
                <div className={styles.sectionContent}>
                  <ul>
                    <li>Static typing with inference</li>
                    <li>Ownership + GC hybrid</li>
                    <li>True parallelism (no GIL)</li>
                    <li>Python-like syntax</li>
                  </ul>
                </div>
              </div>

              <div className={styles.comparisonSection}>
                <h4 className={styles.sectionTitle}>Best For</h4>
                <div className={styles.sectionContent}>
                  <ul>
                    <li>High-performance apps</li>
                    <li>System programming</li>
                    <li>Concurrent applications</li>
                    <li>Python/Rust interop</li>
                  </ul>
                </div>
              </div>

              <div className={styles.comparisonSection}>
                <h4 className={styles.sectionTitle}>Advantages</h4>
                <div className={styles.sectionContent}>
                  <ul>
                    <li>Python ecosystem access</li>
                    <li>Rust performance</li>
                    <li>Memory safety</li>
                    <li>Easy migration path</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className={styles.languageCard}>
              <div className={styles.languageHeader}>
                <div className={styles.languageIcon}>
                  <Gauge />
                </div>
                <h3 className={styles.languageName}>Rust</h3>
              </div>
              <p className={styles.languageTagline}>"Fast and safe"</p>

              <div className={styles.comparisonSection}>
                <h4 className={styles.sectionTitle}>Performance</h4>
                <div className={styles.performanceBar}>
                  <div className={`${styles.performanceFill} ${styles.rust}`}></div>
                </div>
                <p className={styles.performanceLabel}>Compiled • Maximum speed</p>
              </div>

              <div className={styles.comparisonSection}>
                <h4 className={styles.sectionTitle}>Characteristics</h4>
                <div className={styles.sectionContent}>
                  <ul>
                    <li>Static typing</li>
                    <li>Ownership system</li>
                    <li>Zero-cost abstractions</li>
                    <li>Explicit syntax</li>
                  </ul>
                </div>
              </div>

              <div className={styles.comparisonSection}>
                <h4 className={styles.sectionTitle}>Best For</h4>
                <div className={styles.sectionContent}>
                  <ul>
                    <li>Systems programming</li>
                    <li>Game engines</li>
                    <li>Operating systems</li>
                    <li>Performance-critical apps</li>
                  </ul>
                </div>
              </div>

              <div className={styles.comparisonSection}>
                <h4 className={styles.sectionTitle}>Limitations</h4>
                <div className={styles.sectionContent}>
                  <ul>
                    <li>Steep learning curve</li>
                    <li>Verbose syntax</li>
                    <li>Slower development</li>
                    <li>Complex borrow checker</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.features}>
          <div className={styles.featuresHeader}>
            <h2 className={styles.featuresTitle}>
              Platform <span className={styles.highlight}>Features</span>
            </h2>
            <p className={styles.featuresSubtitle}>
              Everything you need to learn, experiment, and build with hybrid programming
            </p>
          </div>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Code2 />
              </div>
              <h3 className={styles.featureTitle}>Interactive Playground</h3>
              <p className={styles.featureDescription}>
                Write, run, and experiment with SimBa code directly in your browser. No installation required.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Zap />
              </div>
              <h3 className={styles.featureTitle}>Real-time Execution</h3>
              <p className={styles.featureDescription}>
                See your code results instantly with our fast execution environment and detailed output console.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Download />
              </div>
              <h3 className={styles.featureTitle}>File Management</h3>
              <p className={styles.featureDescription}>
                Import and export SimBa, Python, and Rust files seamlessly. Manage projects like a professional IDE.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Rocket />
              </div>
              <h3 className={styles.featureTitle}>Project Management</h3>
              <p className={styles.featureDescription}>
                Save, organize, and share your SimBa projects with built-in version control and collaboration tools.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <GitMerge />
              </div>
              <h3 className={styles.featureTitle}>Language Interoperability</h3>
              <p className={styles.featureDescription}>
                Seamlessly integrate Python libraries and Rust performance in a single codebase.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Layers />
              </div>
              <h3 className={styles.featureTitle}>Comprehensive Learning</h3>
              <p className={styles.featureDescription}>
                Learn from beginner to advanced topics with our interactive tutorials and comprehensive documentation.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.comingSoon}>
          <div className={styles.comingSoonContent}>
            <h2 className={styles.comingSoonTitle}>
              <Heart className={styles.comingSoonIcon} />
              Coming Soon: Support SimBa's Future
            </h2>
            <p className={styles.comingSoonDescription}>
              We're working on exciting ways for the community to support SimBa's development and growth.
            </p>
            <div className={styles.comingSoonGrid}>
              <div className={styles.comingSoonCard}>
                <DollarSign className={styles.comingSoonCardIcon} />
                <h3 className={styles.comingSoonCardTitle}>Donation Platform</h3>
                <p className={styles.comingSoonCardDescription}>
                  Support ongoing development with one-time or recurring donations. Help us build the future of hybrid
                  programming.
                </p>
              </div>
              <div className={styles.comingSoonCard}>
                <Target className={styles.comingSoonCardIcon} />
                <h3 className={styles.comingSoonCardTitle}>Project Funding</h3>
                <p className={styles.comingSoonCardDescription}>
                  Sponsor specific features or improvements. Get recognition and help prioritize development roadmap
                  items.
                </p>
              </div>
              <div className={styles.comingSoonCard}>
                <Users className={styles.comingSoonCardIcon} />
                <h3 className={styles.comingSoonCardTitle}>Community Rewards</h3>
                <p className={styles.comingSoonCardDescription}>
                  Exclusive access to beta features, special recognition, and early access to new platform capabilities.
                </p>
              </div>
            </div>
            <p className={styles.comingSoonFooter}>
              Want to be notified when these features launch?{" "}
              <Link to="/signup" className={styles.comingSoonLink}>
                Join our community
              </Link>{" "}
              to stay updated.
            </p>
          </div>
        </section>

        <section className={styles.cta}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Ready to explore hybrid programming?</h2>
            <p className={styles.ctaDescription}>
              Join our community of developers building the future of programming languages.
            </p>
            <div className={styles.ctaActions}>
              <Link to="/signup" className={styles.primaryButton}>
                Get Started
                <ArrowRight className={styles.buttonIcon} />
              </Link>
              <Link to="/guide" className={styles.secondaryButton}>
                View Guide
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
