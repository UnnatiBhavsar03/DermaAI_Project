import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

const UserAuthLayout = ({ children, title, subtitle, maxWidth, sideImage, imageOverlay }) => {
    // Determine max-width: prioritize prop, else default based on sideImage presence
    const widthClass = maxWidth ? maxWidth : (sideImage ? "max-w-4xl" : "max-w-lg");

    return (
        <div className="min-h-screen flex flex-col bg-mint-50 selection:bg-mint-200 selection:text-mint-900 relative overflow-hidden font-sans">

            {/* Background Blobs (Same as Landing Page) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
                <div className="absolute top-[10%] left-[10%] w-96 h-96 bg-mint-200/40 rounded-full mix-blend-multiply filter blur-3xl animate-float"></div>
                <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-teal-100/40 rounded-full mix-blend-multiply filter blur-3xl animate-float animation-delay-2000"></div>
            </div>

            {/* Navbar (Glassy - Uniform with Dashboard) */}
            <nav className="w-full bg-white/60 backdrop-blur-xl border-b border-white/40 sticky top-0 z-50 shadow-sm transition-all duration-300">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-mint-600 font-cursive hover:scale-105 transition-transform">
                        Derma Ai
                    </Link>
                    <Link to="/" className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-gray-500 hover:text-teal-600 hover:bg-white/50 border border-transparent hover:border-white/50 transition-all">
                        Back to Home
                    </Link>
                </div>
            </nav>

            {/* Main Content Wrapper - Centers the card */}
            <div className="flex-1 flex items-center justify-center p-4 relative z-10 w-full">
                {/* Main Card - Fit Screen & Scrollable Content */}
                <div className={`w-full ${widthClass} mx-auto bg-white/60 backdrop-blur-xl border border-white/50 rounded-[2rem] shadow-2xl shadow-mint-100/50 animate-fade-in-up overflow-hidden flex flex-col md:flex-row max-h-[calc(100vh-120px)] min-h-[600px]`}>

                    {/* Side Image (Optional) */}
                    {sideImage && (
                        <div className="hidden md:block w-1/2 relative">
                            <img
                                src={sideImage}
                                alt="Auth Design"
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-teal-900/60 via-transparent to-transparent"></div>

                            {/* Image Overlay Content */}
                            {imageOverlay && (
                                <div className="absolute bottom-6 left-0 w-full px-6 flex justify-center z-20">
                                    {imageOverlay}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Content Side - Scrollable */}
                    <div className={`w-full ${sideImage ? 'md:w-1/2' : ''} p-8 md:p-12 flex flex-col overflow-y-auto custom-scrollbar`}>
                        <div className="text-center mb-6 flex-shrink-0">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-sm text-teal-600 mb-4">
                                <Sparkles size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 font-serif">{title}</h2>
                            {subtitle && <p className="text-gray-500 mt-2">{subtitle}</p>}
                        </div>

                        <div className="flex-1">
                            {children}
                        </div>
                    </div>

                </div>

            </div>



            {/* Footer - Pushed to bottom */}
            <div className="py-6 text-center text-xs text-gray-400 relative z-10">
                &copy; 2025 Derma Ai. Secure & Private.
            </div>
        </div >
    );
};

export default UserAuthLayout;
