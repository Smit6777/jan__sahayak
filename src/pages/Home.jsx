import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Scene3D from '../components/Scene3D';
import WelcomeModal from '../components/WelcomeModal';
import './Home.css';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../config/translations';

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
    const { language, setLanguage } = useLanguage();
    const t = translations[language] || translations['en'];

    // Visitor counter — increments on each unique session
    const [visitorCount, setVisitorCount] = useState(0);
    useEffect(() => {
        const stored = parseInt(localStorage.getItem('js_visitors') || '1247', 10);
        const bumped = stored + 1;
        localStorage.setItem('js_visitors', String(bumped));
        setVisitorCount(bumped);
    }, []);

    return (
        <div className="home-page">
            <WelcomeModal />
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
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="nav-language-select"
                            >
                                <option value="en">English</option>
                                <option value="hi">हिंदी</option>
                                <option value="gu">ગુજરાતી</option>
                            </select>
                            <Link to="/gramvani">📰 ग्रामवाणी</Link>
                            <Link to="/adhikar">⚖️ अधिकार</Link>
                            <Link to="/shikayat">📣 शिकायत</Link>
                            <Link to="/history">{t.nav.history}</Link>
                            <Link to="/form" className="btn btn-primary">{t.nav.startFilling}</Link>
                        </div>
                    </div>
                </nav>

                {/* Helpline Banner */}
                <div className="helpline-banner">
                    <span className="helpline-icon">📞</span>
                    <span className="helpline-text">सरकारी सहायता हेल्पलाइन: <strong>1800-180-1551</strong> (24×7 निःशुल्क)</span>
                    <a href="tel:18001801551" className="helpline-call-btn">अभी कॉल करें</a>
                </div>

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
                            key={`h1-${language}`}
                            className="hero-title language-fade"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                        >
                            {t.hero.title1} <br />
                            <span className="text-gradient">{t.hero.title2}</span>
                        </motion.h1>

                        <motion.p
                            key={`p-${language}`}
                            className="hero-subtitle language-fade"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            {t.hero.subtitle}
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
                                <span className="stat-label">{t.hero.stats.schemes}</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">&lt;2min</span>
                                <span className="stat-label">{t.hero.stats.time}</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">100%</span>
                                <span className="stat-label">{t.hero.stats.free}</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">{visitorCount.toLocaleString('en-IN')}</span>
                                <span className="stat-label">👁️ Visitors</span>
                            </div>
                        </motion.div>

                        {/* MEGA MIC — FARMER FIRST DESIGN */}
                        <motion.div
                            className="mega-mic-container"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.4, type: 'spring', stiffness: 100 }}
                        >
                            {/* Bouncing arrows */}
                            <div className="mega-mic-arrows">
                                {[0, 0.15, 0.3].map((d, i) => (
                                    <motion.span key={i}
                                        animate={{ y: [0, 10, 0] }}
                                        transition={{ duration: 1, repeat: Infinity, delay: d }}
                                        style={{ fontSize: '1.5rem' }}>⬇️</motion.span>
                                ))}
                            </div>

                            <button
                                className="mega-mic-btn"
                                onClick={() => navigate('/form?mode=voice')}
                                aria-label="बोलो — AI आपकी मदद करेगा">
                                {/* Pulsing rings */}
                                <div className="mega-ring mega-ring-1" />
                                <div className="mega-ring mega-ring-2" />
                                <div className="mega-ring mega-ring-3" />
                                <span className="mega-mic-icon">🎙️</span>
                            </button>

                            <p className="mega-label-hi">यहाँ दबाएं और बोलें</p>
                            <p className="mega-label-en">Press &amp; Speak — AI fills your form</p>
                            <p className="mega-label-gu">અહીં દબાવો અને બોલો</p>
                        </motion.div>
                    </div>
                </section>

                {/* Quick Nav Section — Gramvani / Adhikar / Shikayat */}
                <section className="quick-nav-section">
                    <div className="container">
                        <div className="quick-nav-grid">
                            {[
                                { to: '/gramvani', icon: '📰', label: 'ग्रामवाणी', sub: 'Latest scheme news', color: '#22c55e' },
                                { to: '/adhikar', icon: '⚖️', label: 'अधिकार', sub: 'Know your rights', color: '#f59e0b' },
                                { to: '/shikayat', icon: '📣', label: 'शिकायत', sub: 'File a complaint', color: '#ef4444' },
                            ].map((item) => (
                                <motion.div key={item.to}
                                    className="quick-nav-card"
                                    style={{ borderColor: item.color + '44' }}
                                    whileHover={{ scale: 1.05, borderColor: item.color }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => navigate(item.to)}
                                >
                                    <span className="qnc-icon">{item.icon}</span>
                                    <div>
                                        <h4 className="qnc-label" style={{ color: item.color }}>{item.label}</h4>
                                        <p className="qnc-sub">{item.sub}</p>
                                    </div>
                                    <span className="qnc-arrow">→</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="features-section">
                    <div className="container">
                        <motion.div
                            key={`feat-${language}`}
                            className="section-header language-fade"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2>{t.features.title1}<span className="text-gradient">{t.features.title2}</span>{t.features.title3}</h2>
                            <p>{t.features.subtitle}</p>
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
                            key={`schm-${language}`}
                            className="section-header language-fade"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2>{t.schemes.title1}<span className="text-gradient">{t.schemes.title2}</span></h2>
                            <p>{t.schemes.subtitle}</p>
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
                                    <h3>{language === 'hi' || language === 'gu' ? scheme.nameHi : scheme.name}</h3>
                                    <span className="scheme-name-hi">{language === 'en' ? scheme.nameHi : ''}</span>
                                    <p>{scheme.description}</p>
                                    <Link
                                        to={`/form?scheme=${scheme.id}`}
                                        className="scheme-btn"
                                        style={{ background: scheme.color }}
                                    >
                                        <span>{t.schemes.btn}</span>
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
                            key={`cta-${language}`}
                            className="cta-card glass-card language-fade"
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                        >
                            <h2>{t.cta.title}</h2>
                            <p>{t.cta.subtitle}</p>
                            <Link to="/form" className="btn btn-primary btn-lg">
                                <span>✨</span> {t.cta.btn}
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
                            {t.footer}
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
}
