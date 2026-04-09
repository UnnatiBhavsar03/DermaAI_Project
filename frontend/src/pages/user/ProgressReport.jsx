import React, { useState, useRef, useEffect } from 'react';
import { Upload, ArrowRight, Activity, AlertCircle, Sparkles, Camera, X, Clock, CheckCircle } from 'lucide-react';
const ProgressReport = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    useEffect(() => {
        if (user.user_id) {
            fetch(`http://localhost:5001/api/user/comparison-history/${user.user_id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        setHistory(data.history || []);
                    }
                    setHistoryLoading(false);
                })
                .catch(err => {
                    console.error("Error fetching comparison history:", err);
                    setHistoryLoading(false);
                });
        } else {
            setHistoryLoading(false);
        }
    }, [user.user_id]);

    const handleHistoryClick = (record) => {
        setResult({
            status: "success",
            previous_image_url: record.previous_image_url ? record.previous_image_url.replace('http://localhost:5001', '') : null,
            current_image_url: record.current_image_url ? record.current_image_url.replace('http://localhost:5001', '') : null,
            is_history_view: true,
            is_approved: record.is_approved,
            result: {
                comparison_summary: record.comparison_summary,
                status: record.status,
                detected_issue: record.detected_issue,
                improvement_score: record.improvement_score
            }
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteHistory = async (e, history_id) => {
        e.preventDefault();
        e.stopPropagation();

        if (!window.confirm("Are you sure you want to delete this comparison history record?")) return;

        try {
            const res = await fetch(`http://localhost:5001/api/user/comparison-history/${history_id}?user_id=${user.user_id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.status === 'success') {
                setHistory(prev => prev.filter(h => h.history_id !== history_id));
            } else {
                alert(data.message || "Failed to delete comparison history");
            }
        } catch (err) {
            console.error("Delete error:", err);
            alert("Network error while trying to delete.");
        }
    };

    // Camera State
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const startCamera = async () => {
        setIsCameraOpen(true);
        setFile(null);
        setPreview(null);
        setResult(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            streamRef.current = stream;
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access camera. Please check permissions.");
            setIsCameraOpen(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0);

            canvas.toBlob((blob) => {
                const capturedFile = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
                setFile(capturedFile);
                setPreview(URL.createObjectURL(capturedFile));
                stopCamera();
            }, 'image/jpeg');
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setResult(null);
            setIsCameraOpen(false);
        }
    };

    const handleSubmit = async () => {
        if (!file || !user.user_id) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('image', file);
        formData.append('user_id', user.user_id);

        try {
            const response = await fetch('http://localhost:5001/api/user/progress-report', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();

            if (data.status === 'success') {
                setResult(data);
            } else {
                alert('Analysis failed: ' + data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Network error, please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in-up max-w-5xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
                    Track Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600">Skin Progress</span>
                </h1>
                <p className="text-slate-500 font-medium text-lg max-w-2xl mx-auto">
                    Upload a new photo or take one now to compare with your previous scan.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-start">
                {/* Upload/Camera Section */}
                <div className={`bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 transition-all ${result ? 'order-2 md:order-1' : 'col-span-2 max-w-2xl mx-auto w-full'}`}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                <div className="p-2.5 bg-violet-100 text-violet-600 rounded-xl">
                                    <Activity size={24} />
                                </div>
                                New Photo
                            </h2>
                            {result && <span className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full uppercase tracking-wide">Analyzed</span>}
                        </div>

                        {/* Selection Tabs */}
                        {!isCameraOpen && !preview && !loading && (
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => document.getElementById('file-upload').click()} className="flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-slate-100 hover:border-violet-200 hover:bg-violet-50/50 transition-all group">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 group-hover:text-violet-600 shadow-sm mb-3">
                                        <Upload size={24} />
                                    </div>
                                    <span className="font-bold text-slate-600 group-hover:text-violet-700">Upload Photo</span>
                                </button>
                                <button onClick={startCamera} className="flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-slate-100 hover:border-violet-200 hover:bg-violet-50/50 transition-all group">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 group-hover:text-violet-600 shadow-sm mb-3">
                                        <Camera size={24} />
                                    </div>
                                    <span className="font-bold text-slate-600 group-hover:text-violet-700">Take Photo</span>
                                </button>
                                <input
                                    id="file-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </div>
                        )}

                        {/* Camera View */}
                        {isCameraOpen && (
                            <div className="relative rounded-[2rem] overflow-hidden bg-black aspect-[4/3]">
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                                    <button onClick={capturePhoto} className="w-16 h-16 rounded-full bg-white border-4 border-slate-200 flex items-center justify-center hover:scale-105 transition-transform">
                                        <div className="w-12 h-12 bg-violet-600 rounded-full"></div>
                                    </button>
                                    <button onClick={stopCamera} className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-md">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Preview Section */}
                        {preview && (
                            <div className="relative rounded-[2rem] overflow-hidden border-2 border-violet-100 bg-violet-50/30">
                                <img src={preview} alt="Preview" className="w-full h-64 object-cover" />
                                {!loading && (
                                    <div className="absolute top-4 right-4">
                                        <button onClick={() => { setFile(null); setPreview(null); setResult(null); }} className="p-2 bg-white/80 backdrop-blur-md text-slate-600 rounded-full hover:bg-white transition-colors shadow-sm">
                                            <X size={20} />
                                        </button>
                                    </div>
                                )}
                                {loading && (
                                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mb-4"></div>
                                        <p className="text-violet-700 font-bold animate-pulse">Analyzing differences...</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {!result && file && !loading && (
                            <button
                                onClick={handleSubmit}
                                className="w-full py-4 rounded-2xl font-black text-lg bg-slate-900 text-white hover:bg-slate-800 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                            >
                                Compare Progress <ArrowRight size={20} />
                            </button>
                        )}

                        {result && (
                            <button
                                onClick={() => { setFile(null); setPreview(null); setResult(null); }}
                                className="w-full py-3 rounded-2xl font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors"
                            >
                                Start New Analysis
                            </button>
                        )}

                    </div>
                </div>

                {/* Result Section */}
                {result && (
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl text-white md:col-span-1 animate-in slide-in-from-right duration-500">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-white/10 rounded-xl text-white">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">
                                    {result.is_history_view ? "Historical Progress Report" : "Progress Report"}
                                </h2>
                                <p className="text-slate-400 text-sm font-medium">
                                    {result.is_history_view
                                        ? (result.is_approved ? "Verified by Admin" : "Pending Verification")
                                        : "AI-Generated Comparison"}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Images Comparison */}
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {result.previous_image_url && (
                                    <div className="flex-1 min-w-[140px]">
                                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Previous</p>
                                        <img src={`http://localhost:5001${result.previous_image_url}`} alt="Previous" className="w-full h-32 object-cover rounded-2xl border border-white/10 opacity-60" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-[140px]">
                                    <p className="text-[10px] uppercase tracking-widest font-bold text-violet-400 mb-2">Current</p>
                                    <img src={`http://localhost:5001${result.current_image_url}`} alt="Current" className="w-full h-32 object-cover rounded-2xl border-2 border-violet-500 shadow-lg shadow-violet-500/20" />
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Activity size={18} className="text-violet-400" />
                                    <h3 className="font-bold text-lg">Analysis Summary</h3>
                                </div>
                                <p className="text-slate-300 leading-relaxed text-sm">
                                    {result.result.comparison_summary}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="bg-white/5 p-4 rounded-2xl">
                                    <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-1">Status</span>
                                    <span className={`text-lg font-black ${result.result.status === 'Improved' ? 'text-green-400' : result.result.status === 'Worsened' ? 'text-red-400' : 'text-blue-400'}`}>
                                        {result.result.status}
                                    </span>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl">
                                    <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-1">Issue</span>
                                    <span className="text-lg font-black text-white">
                                        {result.result.detected_issue}
                                    </span>
                                </div>
                                {result.result.improvement_score !== undefined && (
                                    <div className="bg-white/5 p-4 rounded-2xl col-span-2 md:col-span-1 border border-violet-500/20">
                                        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-1">Improvement Score</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xl font-black ${result.result.improvement_score > 0 ? 'text-green-400' : result.result.improvement_score < 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                                {result.result.improvement_score > 0 ? '+' : ''}{result.result.improvement_score}%
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-violet-600/20 border border-violet-500/30 p-4 rounded-2xl flex gap-3 items-start">
                                <AlertCircle className="text-violet-400 shrink-0 mt-0.5" size={18} />
                                <p className="text-xs text-violet-200">
                                    This comparison tracks visual changes only. Please consult a dermatologist for medical advice.
                                </p>
                            </div>

                        </div>
                    </div>
                )}
            </div>
            {/* Comparison History Section */}
            <div className="mt-16 border-t border-slate-200 pt-12">
                <div className="mb-8 pl-4">
                    <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <Clock className="text-violet-600" /> Comparison History
                    </h2>
                    <p className="text-slate-500 font-medium mt-2">View your past progress reports and their verification status.</p>
                </div>

                {historyLoading ? (
                    <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div></div>
                ) : history.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-6">
                        {history.map((record) => (
                            <div
                                key={record.history_id}
                                onClick={() => handleHistoryClick(record)}
                                className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer group hover:scale-[1.02]"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm font-bold text-slate-500">{record.created_at}</span>
                                    <div className="flex items-center gap-2">
                                        {record.is_approved ? (
                                            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center gap-1"><CheckCircle size={14} /> Verified</span>
                                        ) : (
                                            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center gap-1"><Clock size={14} /> Pending Verification</span>
                                        )}
                                        <button
                                            onClick={(e) => handleDeleteHistory(e, record.history_id)}
                                            className="p-1.5 rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors shadow-sm"
                                            title="Delete History"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-3 mb-4">
                                    {record.previous_image_url && (
                                        <div className="flex-1">
                                            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">Previous</p>
                                            <img src={`http://localhost:5001${record.previous_image_url}`} alt="Previous" className="w-full h-24 object-cover rounded-xl border border-slate-100" />
                                        </div>
                                    )}
                                    {record.current_image_url && (
                                        <div className="flex-1">
                                            <p className="text-[10px] uppercase tracking-widest font-bold text-violet-600 mb-1">Current</p>
                                            <img src={`http://localhost:5001${record.current_image_url}`} alt="Current" className="w-full h-24 object-cover rounded-xl border-2 border-violet-200" />
                                        </div>
                                    )}
                                </div>

                                <div className="bg-slate-50 rounded-2xl p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`font-black ${record.status === 'Improved' ? 'text-green-600' : record.status === 'Worsened' ? 'text-red-600' : 'text-blue-600'}`}>
                                            {record.status}
                                        </span>
                                        {record.improvement_score !== undefined && record.improvement_score !== null && (
                                            <span className={`font-black ${record.improvement_score > 0 ? 'text-green-600' : record.improvement_score < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                                {record.improvement_score > 0 ? '+' : ''}{record.improvement_score}%
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{record.comparison_summary}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-50 rounded-[2rem] py-12 text-center text-slate-500 font-medium border-2 border-dashed border-slate-200">
                        No comparison history found. Capture a photo to get started!
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProgressReport;
