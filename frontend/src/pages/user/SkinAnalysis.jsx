
import React, { useState, useRef } from 'react';
import { Camera, Upload, ArrowRight, X, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';

const SkinAnalysis = () => {
    const [step, setStep] = useState('select'); // select, capture, preview, analyzing, result
    const [image, setImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isCameraActive, setIsCameraActive] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();
    const { addToast } = useToast();

    // Handle File Upload
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setStep('preview');
        }
    };

    // Start Camera
    const startCamera = async () => {
        try {
            setStep('capture');
            setIsCameraActive(true);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            addToast("Could not access camera. Please check permissions.", 'error');
            console.error(err);
        }
    };

    // Stop Camera
    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    };

    // Capture Image from Video Stream
    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw video frame to canvas
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert to Blob
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
                    setImage(file);
                    setPreviewUrl(URL.createObjectURL(blob));
                    stopCamera();
                    setStep('preview');
                }
            }, 'image/jpeg', 0.9);
        }
    };

    // Submit for Analysis
    const handleAnalysis = async () => {
        if (!image) return;

        setStep('analyzing');
        const formData = new FormData();
        formData.append('image', image);

        // Get user ID if available (optional)
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.user_id) {
            formData.append('user_id', user.user_id);
        }

        try {
            const response = await fetch('http://localhost:5001/api/analyze-skin', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setAnalysisResult(data.result);
                setStep('result');
                addToast("Analysis complete!", 'success');
            } else {
                addToast(data.message || "Analysis failed.", 'error');
                setStep('preview');
            }
        } catch (error) {
            console.error("Analysis Error:", error);
            addToast("Server connection failed.", 'error');
            setStep('preview');
        }
    };

    const resetAnalysis = () => {
        setImage(null);
        setPreviewUrl(null);
        setAnalysisResult(null);
        setStep('select');
    };

    return (
        <div className="flex flex-col items-center justify-center animate-fade-in-up pb-8">
            <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[600px] flex flex-col relative">

                {/* Header */}
                <div className="bg-gradient-to-r from-teal-600 to-mint-600 p-8 text-white flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold font-serif mb-1">Skin Analysis AI</h1>
                        <p className="text-teal-100 text-sm font-medium">Powered by Gemini 1.5 Flash</p>
                    </div>
                </div>

                <div className="flex-1 p-8 flex flex-col items-center justify-center w-full">

                    {/* STEP 1: SELECTION */}
                    {step === 'select' && (
                        <div className="grid md:grid-cols-2 gap-8 w-full max-w-2xl animate-fade-in">
                            <button
                                onClick={() => fileInputRef.current.click()}
                                className="group flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-200 rounded-[2rem] hover:border-teal-500 hover:bg-teal-50 transition-all duration-300"
                            >
                                <div className="w-20 h-20 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Upload size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Upload Photo</h3>
                                <p className="text-gray-500 text-center">Select an image from your gallery</p>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                />
                            </button>

                            <button
                                onClick={startCamera}
                                className="group flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-200 rounded-[2rem] hover:border-purple-500 hover:bg-purple-50 transition-all duration-300"
                            >
                                <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Camera size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Click Photo</h3>
                                <p className="text-gray-500 text-center">Take a photo using your camera</p>
                            </button>
                        </div>
                    )}

                    {/* STEP 2: CAMERA CAPTURE */}
                    {step === 'capture' && (
                        <div className="flex flex-col items-center w-full max-w-2xl animate-fade-in relative">
                            <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden shadow-lg mb-6">
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                                <canvas ref={canvasRef} className="hidden"></canvas>

                                <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                                    <button
                                        onClick={capturePhoto}
                                        className="w-16 h-16 bg-white rounded-full border-4 border-gray-200 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                                    >
                                        <div className="w-12 h-12 bg-red-500 rounded-full"></div>
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={() => { stopCamera(); setStep('select'); }}
                                className="text-gray-500 hover:text-gray-700 font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    )}

                    {/* STEP 3: PREVIEW */}
                    {step === 'preview' && (
                        <div className="flex flex-col items-center w-full max-w-2xl animate-fade-in">
                            <div className="w-full aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden shadow-md mb-6 relative group">
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button onClick={resetAnalysis} className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-white/30">
                                        <RefreshCw size={16} /> Retake
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleAnalysis}
                                className="bg-gradient-to-r from-teal-600 to-mint-600 text-white font-bold text-lg px-12 py-4 rounded-full shadow-xl shadow-mint-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-3"
                            >
                                Analyze Skin <ArrowRight size={24} />
                            </button>
                            <button
                                onClick={resetAnalysis}
                                className="mt-4 text-gray-400 hover:text-gray-600 text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    )}

                    {/* STEP 4: ANALYZING */}
                    {step === 'analyzing' && (
                        <div className="flex flex-col items-center w-full max-w-2xl animate-fade-in relative text-center">
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">AI Analyzing your skin...</h3>
                            <p className="text-gray-500 mb-6 font-medium">Extracting facial features and examining potential conditions.</p>

                            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl mb-8 group bg-slate-900 border border-teal-500/20">
                                <img src={previewUrl} alt="Analyzing" className="w-full h-full object-contain opacity-80" />

                                {/* Overlay Scanning Effect */}
                                <div className="absolute inset-0 z-10 pointer-events-none">
                                    {/* Scanning Line & Gradient */}
                                    <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-transparent to-teal-400/20 animate-[scanVertical_3s_ease-in-out_infinite]">
                                        <div className="absolute bottom-0 left-0 w-full h-1 bg-teal-400 shadow-[0_0_20px_rgba(45,212,191,1)]"></div>
                                        {/* Scanner laser line center highlight */}
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-white shadow-[0_0_20px_#fff]"></div>
                                    </div>

                                    {/* AI 'Stars' or Feature Points on face area (centralized) */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="relative w-64 h-64">
                                            {/* Center focus circles */}
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full border border-teal-500/30 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 border border-teal-500/20 border-dashed rounded-full animate-[spin_10s_linear_infinite]"></div>

                                            {/* White Stars */}
                                            <div className="absolute top-[20%] left-[30%] w-2 h-2 bg-white rounded-full shadow-[0_0_10px_#fff] animate-pulse"></div>
                                            <div className="absolute top-[50%] left-[45%] w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_10px_#fff] animate-pulse" style={{ animationDelay: '500ms' }}></div>
                                            <div className="absolute top-[25%] left-[70%] w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_#fff] animate-ping" style={{ animationDuration: '2s' }}></div>
                                            <div className="absolute top-[60%] left-[60%] w-2 h-2 bg-white rounded-full shadow-[0_0_12px_#fff] animate-pulse" style={{ animationDelay: '1000ms' }}></div>
                                            <div className="absolute top-[40%] left-[80%] w-2 h-2 bg-white rounded-full shadow-[0_0_10px_#fff] animate-pulse" style={{ animationDelay: '700ms' }}></div>
                                            <div className="absolute top-[75%] left-[40%] w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_#fff] animate-ping" style={{ animationDuration: '2.5s', animationDelay: '300ms' }}></div>
                                            <div className="absolute top-[30%] left-[10%] w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_5px_#fff] animate-ping" style={{ animationDuration: '1.5s' }}></div>

                                            {/* Connecting lines for 'AI network' look */}
                                            <svg className="absolute inset-0 w-full h-full opacity-70" viewBox="0 0 256 256">
                                                <path d="M 76 51 L 115 128 L 179 64 L 153 153 L 204 102 L 153 153 L 102 192 L 115 128 L 25 76 L 76 51" fill="none" stroke="rgba(45,212,191,0.6)" strokeWidth="1" strokeDasharray="4 4" className="animate-pulse" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Tech UI Overlays */}
                                    <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-teal-400/80"></div>
                                    <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-teal-400/80"></div>
                                    <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-teal-400/80"></div>
                                    <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-teal-400/80"></div>

                                    {/* Data readouts overlay */}
                                    <div className="absolute top-8 right-8 text-right text-teal-400 font-mono text-xs hidden sm:block drop-shadow-[0_0_5px_rgba(45,212,191,0.8)]">
                                        <p className="mb-1 animate-pulse">ANALYSIS_MODE: ACTIVE</p>
                                        <p className="mb-1">TARGET: FACE_REGION</p>
                                        <p className="mb-1 text-white animate-[pulse_1s_ease-in-out_infinite]">PROCESSING...</p>
                                        <p className="mt-4">SCAN_RATE: 120Hz</p>
                                    </div>
                                </div>
                            </div>

                            <style>{`
                                @keyframes scanVertical {
                                    0% { top: -33%; opacity: 0; }
                                    10% { opacity: 1; }
                                    90% { opacity: 1; }
                                    100% { top: 100%; opacity: 0; }
                                }
                            `}</style>
                        </div>
                    )}

                    {/* STEP 5: RESULT / WAITING MESSAGE */}
                    {step === 'result' && (
                        <div className="w-full max-w-2xl animate-fade-in-up text-center">
                            <div className="bg-white border border-gray-100 rounded-[2rem] p-10 shadow-sm">
                                <div className="w-24 h-24 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle size={48} />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-800 mb-4">Scan Submitted</h2>
                                <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                                    Your skin analysis has been successfully recorded. Our dermatologists will review the AI findings and provide a verified diagnosis shortly.
                                </p>

                                <div className="bg-teal-50 text-teal-800 p-4 rounded-xl mb-8 text-sm inline-block">
                                    <p className="font-semibold flex items-center gap-2">
                                        <AlertCircle size={16} />
                                        Please check your dashboard later for the final report.
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <button
                                        onClick={() => navigate('/user/dashboard')}
                                        className="px-8 py-3 rounded-full font-bold bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-200/50 transition-all hover:-translate-y-1"
                                    >
                                        Back to Dashboard
                                    </button>
                                    <button
                                        onClick={resetAnalysis}
                                        className="px-8 py-3 rounded-full font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                                    >
                                        Scan Another
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SkinAnalysis;
