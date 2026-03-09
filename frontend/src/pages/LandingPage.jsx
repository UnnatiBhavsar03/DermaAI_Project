import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Scan,
    Sparkles,
    ClipboardCheck,
    Activity,
    AlertTriangle,
    Globe,
    TrendingUp,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    CheckCircle,
    Menu,
    X,
    Star,
    Upload,
    Clock,
    Leaf,
    Package2,
    ChevronRight,
    ChevronLeft
} from 'lucide-react';

// Custom Feature Card Component based on user request
const FeatureCard = ({ icon: Icon, label, title, description }) => (
    <div className="relative overflow-hidden bg-gradient-to-br from-mint-50 to-green-100 rounded-[2.5rem] p-8 md:p-10 transition-all duration-500 hover:shadow-xl hover:shadow-mint-100/50 group h-full">
        {/* Label Badge */}
        <div className="inline-block bg-white text-teal-700 text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider mb-6 shadow-sm">
            {label}
        </div>

        {/* Content */}
        <div className="relative z-10">
            <h3 className="text-3xl font-bold text-gray-900 mb-4 font-serif leading-tight">
                {title}
            </h3>
            <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                {description}
            </p>
        </div>
    </div>
);

const LandingPage = () => {
    const [scrolled, setScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const [isDemoOpen, setIsDemoOpen] = useState(false);
    const [demoStep, setDemoStep] = useState(0);
    const [isScanning, setIsScanning] = useState(false);

    const openDemo = () => {
        setDemoStep(0);
        setIsScanning(false);
        setIsDemoOpen(true);
    };
    const closeDemo = () => setIsDemoOpen(false);

    const goNext = () => {
        if (demoStep === 1) {
            setIsScanning(true);
            setTimeout(() => { setIsScanning(false); setDemoStep(2); }, 2000);
        } else {
            setDemoStep(s => Math.min(s + 1, 4));
        }
    };
    const goPrev = () => setDemoStep(s => Math.max(s - 1, 0));

    const STEPS = [
        "Upload Image",
        "AI Analysis",
        "Awaiting Verification",
        "Admin Verified",
        "Recommendation"
    ];

    const renderDemoStep = () => {
        switch (demoStep) {
            case 0: return (
                <div className="flex flex-col items-center gap-6 animate-in fade-in duration-300">
                    <div className="w-full border-2 border-dashed border-teal-300 rounded-[2rem] p-10 flex flex-col items-center gap-4 bg-teal-50/60 hover:bg-teal-50 transition-colors cursor-pointer">
                        <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                            <Upload size={32} />
                        </div>
                        <p className="font-bold text-gray-700 text-lg">Drop your skin photo here</p>
                        <p className="text-sm text-gray-400">or click to browse — JPG, PNG up to 10MB</p>
                        <div className="mt-2 px-6 py-2.5 bg-gradient-to-r from-teal-500 to-mint-500 text-white rounded-full text-sm font-bold shadow hover:shadow-lg transition">
                            Select Photo
                        </div>
                    </div>
                    <div className="w-full bg-white rounded-[1.5rem] p-5 border border-gray-100 shadow-sm">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Step Instruction</p>
                        <p className="text-gray-700 font-medium">Upload a clear photo of your skin so our AI can analyze it.</p>
                    </div>
                </div>
            );
            case 1: return (
                <div className="flex flex-col items-center gap-6 animate-in fade-in duration-300">
                    <div className="relative w-full h-52 rounded-[2rem] overflow-hidden bg-gray-900 shadow-xl">
                        <img src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80" alt="Skin scan demo" className="w-full h-full object-cover opacity-70" />
                        {isScanning && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full border-4 border-teal-400/30 border-t-teal-400 animate-spin"></div>
                                    <Scan className="absolute inset-0 m-auto text-teal-300" size={24} />
                                </div>
                                <div className="flex gap-1">
                                    {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}></div>)}
                                </div>
                                <p className="text-teal-300 text-sm font-bold tracking-wide">Analyzing skin pattern…</p>
                            </div>
                        )}
                        {!isScanning && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <p className="text-white/70 font-bold text-lg">Sample skin image ready</p>
                            </div>
                        )}
                    </div>
                    <div className="w-full bg-white rounded-[1.5rem] p-5 border border-gray-100 shadow-sm">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Step Instruction</p>
                        <p className="text-gray-700 font-medium">Our AI analyzes the skin image to detect possible skin conditions. Click <strong>Next</strong> to watch the scan.</p>
                    </div>
                </div>
            );
            case 2: return (
                <div className="flex flex-col items-center gap-5 animate-in fade-in duration-300">
                    <div className="w-full bg-indigo-50 border border-indigo-100 rounded-[2rem] p-8 flex flex-col items-center text-center gap-4">
                        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow text-indigo-500 animate-pulse">
                            <Clock size={28} />
                        </div>
                        <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Status: Submitted</span>
                        <h4 className="text-xl font-bold text-indigo-900">Review Pending</h4>
                        <p className="text-indigo-700 text-sm max-w-xs leading-relaxed">
                            Your scan has been submitted successfully. Please wait until an admin verifies your scan result.
                        </p>
                        <div className="mt-2 px-5 py-2 bg-indigo-100 text-indigo-600 rounded-full text-xs font-bold">Estimated: 24 hours</div>
                    </div>
                    <div className="w-full bg-white rounded-[1.5rem] p-5 border border-gray-100 shadow-sm">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Step Instruction</p>
                        <p className="text-gray-700 font-medium">Your scan has been submitted successfully. Please wait until an admin verifies your scan result.</p>
                    </div>
                </div>
            );
            case 3: return (
                <div className="flex flex-col items-center gap-5 animate-in fade-in duration-300">
                    <div className="w-full bg-gradient-to-br from-teal-50 to-mint-50 border-2 border-teal-200 rounded-[2rem] p-8 flex flex-col items-center text-center gap-4">
                        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-md text-teal-500">
                            <CheckCircle size={28} />
                        </div>
                        <span className="text-xs font-black text-teal-600 uppercase tracking-widest bg-teal-100 px-3 py-1 rounded-full">✓ Verified</span>
                        <h4 className="text-xl font-bold text-gray-900">Dermatologist Approved</h4>
                        <p className="text-gray-600 text-sm max-w-xs leading-relaxed">
                            Your skin scan has been reviewed and verified by our certified dermatologist / admin. Your personalized report is now ready.
                        </p>
                        <div className="grid grid-cols-2 gap-3 w-full mt-2">
                            <div className="bg-white rounded-2xl p-4 text-left shadow-sm border border-teal-100">
                                <p className="text-xs text-gray-400 font-bold uppercase">Condition</p>
                                <p className="font-bold text-gray-800 mt-1">Acne Vulgaris</p>
                            </div>
                            <div className="bg-white rounded-2xl p-4 text-left shadow-sm border border-teal-100">
                                <p className="text-xs text-gray-400 font-bold uppercase">Confidence</p>
                                <p className="font-bold text-teal-600 mt-1">94.5%</p>
                            </div>
                        </div>
                    </div>
                    <div className="w-full bg-white rounded-[1.5rem] p-5 border border-gray-100 shadow-sm">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Step Instruction</p>
                        <p className="text-gray-700 font-medium">Your skin scan has been verified by our dermatologist / admin. Results are now ready to view.</p>
                    </div>
                </div>
            );
            case 4: return (
                <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                    <div className="bg-gradient-to-br from-mint-50 to-green-100 rounded-[2rem] p-6 border border-mint-100">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Detected Condition</p>
                        <h4 className="text-2xl font-bold text-gray-900 font-serif">Acne Vulgaris</h4>
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">Mild-to-moderate inflammatory acne across the T-zone. Consistent routine recommended.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <Package2 size={16} className="text-blue-500" />
                                <span className="text-xs font-black text-blue-500 uppercase">Products</span>
                            </div>
                            <ul className="text-xs text-gray-600 space-y-1.5">
                                <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-teal-500 flex-shrink-0" /> Salicylic Acid Cleanser</li>
                                <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-teal-500 flex-shrink-0" /> Niacinamide Serum</li>
                                <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-teal-500 flex-shrink-0" /> Oil-Free Moisturizer</li>
                            </ul>
                        </div>
                        <div className="bg-white rounded-2xl p-4 border border-green-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <Leaf size={16} className="text-green-500" />
                                <span className="text-xs font-black text-green-600 uppercase">Remedies</span>
                            </div>
                            <ul className="text-xs text-gray-600 space-y-1.5">
                                <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-green-500 flex-shrink-0" /> Tea Tree Oil (diluted)</li>
                                <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-green-500 flex-shrink-0" /> Aloe Vera Gel Mask</li>
                                <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-green-500 flex-shrink-0" /> Honey & Turmeric Scrub</li>
                            </ul>
                        </div>
                    </div>
                    <Link
                        to="/user/register"
                        onClick={closeDemo}
                        className="mt-2 w-full py-4 bg-gradient-to-r from-teal-500 to-mint-500 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-mint-200/50 hover:shadow-xl transition-all hover:-translate-y-0.5"
                    >
                        Try Skin Scan — It's Free <ArrowRight size={20} />
                    </Link>
                </div>
            );
            default: return null;
        }
    };

    // Scroll to section helper
    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setIsMobileMenuOpen(false);
        }
    };

    return (
        <div className="min-h-screen bg-mint-50 text-gray-900 font-sans selection:bg-mint-200 selection:text-mint-900 overflow-x-hidden">

            {/* 1. Navbar - Glassmorphism */}
            <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white/70 backdrop-blur-lg shadow-sm border-b border-white/20' : 'bg-transparent'}`}>
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-mint-600 font-cursive cursor-pointer relative z-50">
                        Derma Ai
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8">
                        {['Features', 'How it Works'].map((item) => (
                            <button
                                key={item}
                                onClick={() => scrollToSection(item.toLowerCase().replace(/\s+/g, '-'))}
                                className="text-sm font-medium text-gray-600 hover:text-teal-600 transition relative group"
                            >
                                {item}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-teal-400 transition-all group-hover:w-full"></span>
                            </button>
                        ))}
                    </div>

                    <div className="hidden md:flex items-center gap-6">
                        <Link to="/user/login" className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-mint-500 text-white rounded-full text-sm font-bold hover:shadow-lg hover:shadow-mint-200/50 transition transform hover:-translate-y-0.5">
                            Get Started
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden z-50 text-gray-700 hover:text-teal-600 transition"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>

                {/* Mobile Menu Overlay */}
                <div className={`fixed inset-0 bg-white/95 backdrop-blur-xl z-40 transform transition-transform duration-300 flex flex-col items-center justify-center gap-8 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    {['Features', 'How it Works', 'Reviews'].map((item) => (
                        <button
                            key={item}
                            onClick={() => scrollToSection(item.toLowerCase().replace(/\s+/g, '-'))}
                            className="text-2xl font-medium text-gray-800 hover:text-teal-600"
                        >
                            {item}
                        </button>
                    ))}
                    <Link to="/user/login" className="mt-4 px-8 py-3 bg-teal-500 text-white rounded-full text-lg font-bold">
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* 2. Hero Section - Deep Mint Gradient & Glass Cards */}
            <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
                    <div className="absolute top-[10%] left-[10%] w-72 h-72 bg-mint-200/40 rounded-full mix-blend-multiply filter blur-3xl animate-float"></div>
                    <div className="absolute top-[20%] right-[10%] w-96 h-96 bg-teal-100/40 rounded-full mix-blend-multiply filter blur-3xl animate-float animation-delay-2000"></div>
                </div>

                <div className="container mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-white/50 border border-white/60 shadow-sm backdrop-blur-sm text-teal-700 text-sm font-semibold tracking-wide animate-fade-in-up">
                        <Sparkles size={14} className="text-gold-500" />
                        <span>AI-Powered Skincare Revolution</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 text-gray-900 tracking-tight leading-[1.1] animate-fade-in-up delay-100 font-serif">
                        Unlock Your Skin's <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-mint-400">Natural Glow.</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
                        Meet your personal AI dermatologist. Scan your skin, detect issues, and receive a curated routine in seconds.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-5 justify-center items-center animate-fade-in-up delay-300">
                        <Link
                            to="/user/register"
                            className="px-8 py-4 bg-gradient-to-r from-teal-600 to-mint-600 text-white rounded-full font-bold text-lg hover:shadow-xl hover:shadow-mint-200/50 transition-all transform hover:-translate-y-1 flex items-center group min-w-[200px] justify-center"
                        >
                            Start Free Scan
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <button
                            onClick={openDemo}
                            className="px-8 py-4 bg-white/60 backdrop-blur-sm text-gray-800 border border-white/80 rounded-full font-bold text-lg hover:bg-white hover:text-teal-600 hover:border-teal-200 transition-all transform hover:-translate-y-1 hover:shadow-lg min-w-[200px]"
                        >
                            Watch Demo
                        </button>
                    </div>

                    {/* Floating Glass Cards (Visual Only) */}
                    <div className="mt-20 relative max-w-5xl mx-auto hidden md:block animate-fade-in-up delay-500">
                        <div className="absolute top-0 right-10 p-4 bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl shadow-xl transform rotate-6 animate-float animation-delay-1000">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600"><CheckCircle2 size={20} /></div>
                                <div>
                                    <div className="text-xs text-gray-500">Analysis Complete</div>
                                    <div className="font-bold text-sm">Perfectly Hydrated</div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-10 left-10 p-4 bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl shadow-xl transform -rotate-3 animate-float">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center text-gold-600"><Star size={20} /></div>
                                <div>
                                    <div className="text-xs text-gray-500">Recommendation</div>
                                    <div className="font-bold text-sm">Vitamin C Serum</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* 3. Features Section - Glass Cards */}
            <section id="features" className="py-24 relative overflow-hidden">
                <div className="container mx-auto px-6 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-4xl font-bold text-gray-900 mb-6 font-serif">Smart Features for Smarter Skin</h2>
                        <p className="text-gray-500 text-lg">We combine advanced computer vision with dermatological expertise to give you the best advice.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="h-[400px]">
                            <FeatureCard
                                icon={Scan}
                                label="Instant Analysis"
                                title="AI Skin Diagnosis"
                                description="Upload a selfie and get a detailed skin report in seconds using advanced computer vision."
                            />
                        </div>

                        {/* Feature 2 */}
                        <div className="h-[400px]">
                            <FeatureCard
                                icon={Sparkles}
                                label="Personalized Care"
                                title="Product Matching"
                                description="AI curates products based on your specific skin type, concerns, and budget constraints."
                            />
                        </div>

                        {/* Feature 3 */}
                        <div className="h-[400px]">
                            <FeatureCard
                                icon={Activity}
                                label="Track Progress"
                                title="Routine Tracker"
                                description="Monitor your skin's health over time and see the effectiveness of your routine."
                            />
                        </div>

                        {/* Feature 4 */}
                        <div className="h-[400px]">
                            <FeatureCard
                                icon={ClipboardCheck}
                                label="Trusted Results"
                                title="Expert Verification"
                                description="Every AI scan result is reviewed and verified by our dermatology team before being sent to you."
                            />
                        </div>

                        {/* Feature 5 */}
                        <div className="h-[400px]">
                            <FeatureCard
                                icon={AlertTriangle}
                                label="Health Insights"
                                title="Issue Detection"
                                description="Early detection for acne, redness, dryness, and other common skin conditions."
                            />
                        </div>

                        {/* Feature 6 */}
                        <div className="h-[400px]">
                            <FeatureCard
                                icon={TrendingUp}
                                label="Skin Journey"
                                title="Progress Reports"
                                description="Compare scans over time and track your skin's improvement with visual progress reports."
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. How It Works - Visual Flow */}
            <section id="how-it-works" className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row gap-16 items-center">
                        <div className="w-full md:w-1/2">
                            <div className="inline-block mb-4 text-teal-600 font-bold tracking-widest uppercase text-sm">Simple Process</div>
                            <h2 className="text-4xl md:text-5xl font-bold mb-8 font-serif leading-tight">
                                From Selfie to <br />
                                <span className="text-mint-600">Skincare Routine.</span>
                            </h2>

                            <div className="space-y-8">
                                {[
                                    { step: "01", title: "Take a Photo", desc: "Ensure good lighting and a clean face." },
                                    { step: "02", title: "AI Analysis", desc: "Our engine detects skin type and concerns." },
                                    { step: "03", title: "Get Results", desc: "Receive your personalized routine instantly." }
                                ].map((step, i) => (
                                    <div key={i} className="flex gap-6 group">
                                        <div className="text-3xl font-bold text-mint-200 group-hover:text-mint-500 transition-colors font-serif">{step.step}</div>
                                        <div>
                                            <h4 className="text-xl font-bold mb-2 text-gray-900">{step.title}</h4>
                                            <p className="text-gray-500">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-10">
                                <Link to="/user/register" className="text-teal-600 font-bold hover:text-teal-800 inline-flex items-center gap-2 group">
                                    Start your journey now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>

                        {/* Image Placeholder / Abstract Art */}
                        <div className="w-full md:w-1/2 relative h-[500px]">
                            <div className="absolute inset-0 bg-gradient-to-tr from-teal-100 to-mint-50 rounded-[3rem] transform rotate-3"></div>
                            <img
                                src="/assets/skincare_routine_hero.png"
                                alt="AI Skincare Routine"
                                className="absolute inset-0 w-full h-full object-cover rounded-[3rem] transform -rotate-3 hover:rotate-0 transition-all duration-500 shadow-2xl"
                            />

                            {/* Floating Badge */}
                            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl max-w-xs animate-float">
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white"></div>
                                        ))}
                                    </div>
                                    <div className="text-sm font-bold text-gray-600">+20k Users</div>
                                </div>
                                <p className="text-xs text-gray-500 leading-tight">Join the community transforming their skin health today.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. Footer - Minimal & Clean */}
            <footer className="bg-mint-900 text-white pt-20 pb-10">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-10 mb-16 text-center md:text-left">
                        <div>
                            <div className="text-4xl font-bold mb-6 font-cursive text-mint-200">Derma Ai</div>
                            <p className="text-mint-100/60 max-w-sm leading-relaxed">
                                Blending technology with dermatology to bring expert skincare advice to everyone, everywhere.
                            </p>
                        </div>

                        <div className="flex gap-8 md:gap-16 text-sm font-medium text-mint-100/80">
                            <div className="flex flex-col gap-4">
                                <span className="text-white font-bold opacity-100 mb-2">Platform</span>
                                <a href="#" className="hover:text-white transition">Scanning</a>
                                <a href="#" className="hover:text-white transition">Products</a>
                                <a href="#" className="hover:text-white transition">Routine</a>
                            </div>
                            <div className="flex flex-col gap-4">
                                <span className="text-white font-bold opacity-100 mb-2">Company</span>
                                <a href="#" className="hover:text-white transition">About</a>
                                <a href="#" className="hover:text-white transition">Privacy</a>
                                <a href="#" className="hover:text-white transition">Terms</a>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-mint-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-mint-100/40">
                        <div>© 2025 Derma Ai Labs. All rights reserved.</div>
                        <div className="flex gap-4">
                            <Globe size={16} />
                            <span>Global Availability</span>
                        </div>
                    </div>
                </div>
            </footer>

            {/* ── Watch Demo Modal ── */}
            {isDemoOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
                    onClick={(e) => { if (e.target === e.currentTarget) closeDemo(); }}
                >
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-8 pt-7 pb-4 border-b border-gray-100">
                            <div>
                                <p className="text-xs font-black text-teal-500 uppercase tracking-widest mb-0.5">Interactive Demo</p>
                                <h3 className="text-xl font-bold text-gray-900 font-serif">How Derma AI Works</h3>
                            </div>
                            <button onClick={closeDemo} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition">
                                <X size={22} />
                            </button>
                        </div>

                        {/* Step Progress Bar */}
                        <div className="px-8 pt-5 pb-2">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-400 font-bold">Step {demoStep + 1} of {STEPS.length}</span>
                                <span className="text-xs text-teal-600 font-black">{STEPS[demoStep]}</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-teal-400 to-mint-400 rounded-full transition-all duration-500"
                                    style={{ width: `${((demoStep + 1) / STEPS.length) * 100}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-3">
                                {STEPS.map((s, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1">
                                        <div className={`w-3 h-3 rounded-full transition-all duration-300 ${i < demoStep ? 'bg-teal-500' :
                                            i === demoStep ? 'bg-teal-400 ring-4 ring-teal-100 scale-125' :
                                                'bg-gray-200'
                                            }`} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Step Content */}
                        <div className="px-8 py-5 overflow-y-auto flex-1">
                            {renderDemoStep()}
                        </div>

                        {/* Navigation Buttons */}
                        {demoStep < 4 && (
                            <div className="px-8 pb-7 pt-2 flex gap-3 border-t border-gray-50">
                                <button
                                    onClick={goPrev}
                                    disabled={demoStep === 0 || isScanning}
                                    className="flex items-center gap-2 px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold transition disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={18} /> Previous
                                </button>
                                <button
                                    onClick={goNext}
                                    disabled={isScanning}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-teal-500 to-mint-500 text-white rounded-xl font-black shadow hover:shadow-lg transition disabled:opacity-60"
                                >
                                    {demoStep === 1 && !isScanning ? 'Start AI Scan' : isScanning ? 'Scanning…' : 'Next Step'}
                                    {!isScanning && <ChevronRight size={18} />}
                                </button>
                            </div>
                        )}
                        {demoStep === 4 && (
                            <div className="px-8 pb-7 pt-2">
                                <button
                                    onClick={goPrev}
                                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 font-bold transition mb-3"
                                >
                                    <ChevronLeft size={16} /> Back
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

export default LandingPage;
