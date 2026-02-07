import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Scene3D from '../components/Scene3D';
import './Home.css';

const schemes = [
    {
        id: 'pm-kisan',
        name: 'PM Kisan Samman Nidhi',
        nameHi: 'पीएम किसान सम्मान निधि',
        icon: '🌾',
        description: 'Get ₹6,000 annual support for farmers',
        color: '#10b981'
    },
    {
        id: 'vidhva-sahay',
        name: 'Vidhva Sahay Yojana',
        nameHi: 'विधवा सहाय योजना',
        icon: '🏠',
        description: 'Financial assistance for widows',
        color: '#8b5cf6'
    },
    {
        id: 'ration-card',
        name: 'Ration Card Application',
        nameHi: 'राशन कार्ड आवेदन',
        icon: '🍚',
        description: 'Apply for new ration card (BPL/APL)',
        color: '#f59e0b'
    },
    {
        id: 'ayushman-bharat',
        name: 'Ayushman Bharat',
        nameHi: 'आयुष्मान भारत',
        icon: '🏥',
        description: '₹5 Lakh health insurance for families',
        color: '#06b6d4'
    },
    {
        id: 'pm-awas',
        name: 'PM Awas Yojana',
        nameHi: 'पीएम आवास योजना',
        icon: '🏗️',
        description: 'Housing subsidy for rural & urban poor',
        color: '#ec4899'
    },
    {
        id: 'ujjwala',
        name: 'Ujjwala Yojana',
        nameHi: 'उज्ज्वला योजना',
        icon: '🔥',
        description: 'Free LPG connection for BPL families',
        color: '#f97316'
    },
    {
        id: 'sukanya-samriddhi',
        name: 'Sukanya Samriddhi',
        nameHi: 'सुकन्या समृद्धि',
        icon: '👧',
        description: 'Savings scheme for girl child education',
        color: '#a855f7'
    },
    {
        id: 'kisan-credit',
        name: 'Kisan Credit Card',
        nameHi: 'किसान क्रेडिट कार्ड',
        icon: '💳',
        description: 'Low-interest credit for farmers',
        color: '#22c55e'
    }
];

const features = [
    {
        icon: '🎤',
        title: 'Voice Input',
        description: 'Speak in Hindi or Gujarati - our AI understands you',
        link: '/form?mode=voice'
    },
    {
        icon: '📷',
        title: 'Aadhar Scan',
        description: 'Upload Aadhar photo - we auto-fill your details',
        link: '/form?mode=aadhar'
    },
    {
        icon: '📄',
        title: 'Instant PDF',
        description: 'Download filled form ready for submission',
        link: '/form'
    },
    {
        icon: '🤖',
        title: 'AI Powered',
        description: 'Built with AWS Bedrock for accurate form filling',
        link: '/form'
    }
];

export default function Home() {
    const navigate = useNavigate();
    const [hoveredScheme, setHoveredScheme] = useState(null);

    return (
        <div className="home-page">
            <div className="scanlines"></div>
            {/* 3D Background */}
            <Scene3D variant="home" />

            {/* Content */}
            <div className="page-content">
                {/* Navigation */}
                <nav className="navbar">
                    <div className="container navbar-content">
                        <div className="logo">
                            <span className="logo-icon">📋</span>
                            <span className="logo-text">Jan-Sahayak</span>
                        </div>
                        <div className="nav-links">
                            <a href="#features">Features</a>
                            <a href="#schemes">Schemes</a>
                            <Link to="/form" className="btn btn-primary">Start Filling →</Link>
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <section className="hero">
                    <div className="container hero-content">
                        <motion.div
                            className="hero-badge"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <span className="badge-icon">🇮🇳</span>
                            <span>AI for Bharat Hackathon 2026</span>
                        </motion.div>

                        <motion.h1
                            className="hero-title"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                        >
                            Government Forms, <br />
                            <span className="text-gradient">Filled by AI</span>
                        </motion.h1>

                        <motion.p
                            className="hero-subtitle"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            Stop struggling with complex forms. Just speak or upload your Aadhar -
                            our AI fills PM Kisan, Ration Card & more in seconds.
                        </motion.p>

                        <motion.div
                            className="hero-actions"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                        >
                            <Link to="/form" className="btn btn-primary btn-lg">
                                <span>🚀</span> Fill Form Now
                            </Link>
                            <a href="#features" className="btn btn-secondary btn-lg">
                                <span>📖</span> How It Works
                            </a>
                        </motion.div>

                        <motion.div
                            className="hero-stats"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                        >
                            <div className="stat">
                                <span className="stat-value">8</span>
                                <span className="stat-label">Schemes Supported</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">&lt;2min</span>
                                <span className="stat-label">Form Completion</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">100%</span>
                                <span className="stat-label">Free to Use</span>
                            </div>
                        </motion.div>

                        {/* BIG RED MIC BUTTON (Accessibility) */}
                        <motion.div
                            className="mic-button-container"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.8, type: 'spring' }}
                        >
                            <button
                                className="big-red-mic"
                                onClick={() => navigate('/form?mode=voice')}
                                aria-label="Start Voice Assistant"
                            >
                                <div className="mic-icon">🎙️</div>
                                <div className="mic-pulse"></div>
                                <div className="mic-pulse delay-1"></div>
                            </button>
                            <p className="mic-label">बोलने के लिए दबाएं (Tap to Speak)</p>
                        </motion.div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="features-section">
                    <div className="container">
                        <motion.div
                            className="section-header"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2>How <span className="text-gradient">Jan-Sahayak</span> Works</h2>
                            <p>Simple, fast, and accurate form filling for everyone</p>
                        </motion.div>

                        <div className="features-grid">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    className="feature-card glass-card"
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ scale: 1.05, y: -10, cursor: 'pointer' }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate(feature.link)}
                                >
                                    <div className="feature-icon">{feature.icon}</div>
                                    <h3>{feature.title}</h3>
                                    <p>{feature.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Schemes Section */}
                <section id="schemes" className="schemes-section">
                    <div className="container">
                        <motion.div
                            className="section-header"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2>Supported <span className="text-gradient">Government Schemes</span></h2>
                            <p>Select a scheme and start filling your form</p>
                        </motion.div>

                        <div className="schemes-grid">
                            {schemes.map((scheme, index) => (
                                <motion.div
                                    key={scheme.id}
                                    className={`scheme-card ${hoveredScheme === scheme.id ? 'hovered' : ''}`}
                                    style={{ '--scheme-color': scheme.color }}
                                    initial={{ opacity: 0, y: 50, rotateX: -15 }}
                                    whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                                    viewport={{ once: true }}
                                    transition={{
                                        delay: index * 0.1,
                                        type: 'spring',
                                        stiffness: 100
                                    }}
                                    whileHover={{
                                        scale: 1.08,
                                        y: -15,
                                        rotateY: 5,
                                        boxShadow: `0 25px 50px ${scheme.color}50`
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                    onMouseEnter={() => setHoveredScheme(scheme.id)}
                                    onMouseLeave={() => setHoveredScheme(null)}
                                >
                                    <div className="scheme-glow" style={{ background: `radial-gradient(circle, ${scheme.color}30, transparent)` }} />
                                    <motion.div
                                        className="scheme-icon"
                                        animate={{
                                            rotate: hoveredScheme === scheme.id ? [0, -10, 10, 0] : 0,
                                            scale: hoveredScheme === scheme.id ? 1.2 : 1
                                        }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        {scheme.icon}
                                    </motion.div>
                                    <h3>{scheme.name}</h3>
                                    <span className="scheme-name-hi">{scheme.nameHi}</span>
                                    <p>{scheme.description}</p>
                                    <Link
                                        to={`/form?scheme=${scheme.id}`}
                                        className="scheme-btn"
                                        style={{ background: scheme.color }}
                                    >
                                        <span>Fill This Form</span>
                                        <motion.span
                                            animate={{ x: hoveredScheme === scheme.id ? 5 : 0 }}
                                        >
                                            →
                                        </motion.span>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="cta-section">
                    <div className="container">
                        <motion.div
                            className="cta-card glass-card"
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                        >
                            <h2>Ready to Fill Your Form?</h2>
                            <p>No more confusion. No more mistakes. Let AI do the hard work.</p>
                            <Link to="/form" className="btn btn-primary btn-lg">
                                <span>✨</span> Start Now - It's Free
                            </Link>
                        </motion.div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="footer">
                    <div className="container footer-content">
                        <div className="footer-brand">
                            <span className="logo-icon">📋</span>
                            <span>Jan-Sahayak</span>
                        </div>
                        <p className="footer-text">
                            Built with ❤️ for AI for Bharat Hackathon 2026 | Powered by AWS Bedrock
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
}
