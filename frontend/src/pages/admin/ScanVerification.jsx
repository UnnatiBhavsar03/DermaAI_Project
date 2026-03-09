import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Check,
    Package,
    Leaf,
    Sparkles,
    Plus,
    Trash2,
    Save,
    Flag,
    AlertCircle,
    AlertTriangle,
    X
} from "lucide-react";

const ScanVerification = () => {
    const { analysisId } = useParams();
    const navigate = useNavigate();

    const [scan, setScan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [aiLoading, setAiLoading] = useState(false);

    // Draft Data State
    const [routineSummary, setRoutineSummary] = useState("");
    const [products, setProducts] = useState([]);
    const [remedies, setRemedies] = useState([]);
    // New state for is_sent
    const [isSent, setIsSent] = useState(false);
    const [isFlagged, setIsFlagged] = useState(false);

    // View State: 'main', 'products', 'remedies', 'manual'
    const [currentView, setCurrentView] = useState("main");

    // Edit State
    const [editingItem, setEditingItem] = useState(null); // For modal editing

    useEffect(() => {
        // 1. Fetch Scan Details (We can reuse the all-scans endpoint or create a single entry endpoint, 
        //    but for now let's filter from all-scans or assume we need a get-one endpoint. 
        //    Since I didn't make a get-one, I'll fetch all and find. Optimally we'd make a get-one.)
        //    Actually, let's fetch all and filter to avoid backend changes if possible, 
        //    but typically a get-one is better. I'll stick to what I have to minimize risk.
        fetch("http://localhost:5001/api/admin/all-scans")
            .then(res => res.json())
            .then(data => {
                if (data.status === "success") {
                    const found = data.scans.find(s => s.analysis_id === parseInt(analysisId));
                    if (found) {
                        setScan(found);
                        // Trigger AI generation if not reviewed
                        if (!found.is_reviewed) {
                            generateDrafts(found.detected_issue, found.user_allergies);
                        } else {
                            // Fetch existing recommendations
                            fetch(`http://localhost:5001/api/admin/scan-recommendations/${analysisId}`)
                                .then(res => res.json())
                                .then(recData => {
                                    if (recData.status === 'success') {
                                        setRoutineSummary(recData.routine_summary || "");
                                        setProducts(recData.products || []);
                                        setRemedies(recData.remedies || []);
                                    }
                                })
                                .catch(err => console.error("Error fetching recs:", err));
                        }
                        // Check is_sent and is_flagged
                        if (found.is_sent) setIsSent(true);
                        if (found.is_flagged) setIsFlagged(true);
                    } else {
                        alert("Scan not found");
                        navigate("/dashboard/scans");
                    }
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [analysisId, navigate]);

    const generateDrafts = (issue, allergies = []) => {
        setAiLoading(true);
        fetch("http://localhost:5001/api/admin/generate-routine", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ issue: issue, allergies: allergies })
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === "success" && data.routine) {
                    setRoutineSummary(data.routine.routine_summary || "");
                    setProducts(data.routine.products || []);
                    setRemedies(data.routine.remedies || []);
                }
                setAiLoading(false);
            })
            .catch(err => {
                console.error(err);
                setAiLoading(false);
            });
    };

    const handleSave = () => {
        if (window.confirm("Save changes? (This will NOT send to user yet)")) {
            // Prepare payload
            const payload = {
                recommendations: [
                    // Routine Summary as a Remedy
                    {
                        type: 'Remedy',
                        title: 'Daily Routine Summary',
                        description: routineSummary,
                        link: ''
                    },
                    ...products.map(p => ({ ...p, type: 'Product' })),
                    ...remedies.map(r => ({ ...r, type: 'Remedy' }))
                ]
            };

            fetch(`http://localhost:5001/api/admin/verify-scan-batch/${analysisId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        alert("Changes Saved! Now you can send to user.");
                        setScan(prev => ({ ...prev, is_reviewed: true }));
                    } else {
                        alert("Error: " + data.message);
                    }
                })
                .catch(err => alert("Network Error"));
        }
    };

    const handleSend = () => {
        if (window.confirm("Are you sure you want to SEND this to the user? (Cannot be undone)")) {
            fetch(`http://localhost:5001/api/admin/send-response/${analysisId}`, {
                method: 'POST'
            })
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        alert("Sent to User Successfully!");
                        setIsSent(true);
                        navigate("/dashboard/scans");
                    } else {
                        alert("Error: " + data.message);
                    }
                })
                .catch(err => alert("Network Error"));
        }
    };

    const handleFlag = () => {
        if (window.confirm("Flag this scan as INCORRECT? This tells the system the AI detection was wrong.")) {
            fetch(`http://localhost:5001/api/admin/flag-scan/${analysisId}`, {
                method: 'POST'
            })
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        alert("Scan flagged as incorrect successfully.");
                        setIsFlagged(true);
                        setScan(prev => ({ ...prev, is_reviewed: true }));
                    } else {
                        alert("Error: " + data.message);
                    }
                })
                .catch(err => alert("Network Error"));
        }
    };

    // --- Sub-Components (Rendered Inline for Simplicity) ---

    const renderMainView = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Scan Image & Info */}
                <div className="space-y-6">
                    <div className="bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl h-[400px]">
                        <img
                            src={scan?.image_path ? `http://localhost:5001/uploads/${scan?.image_path.split('/').pop()}` : ""}
                            alt="Scan"
                            className={`w-full h-full object-cover transition-opacity duration-500 ${aiLoading ? 'opacity-50' : 'opacity-100'}`}
                        />
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex justify-between items-center">
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Detected Issue</p>
                            <h2 className="text-3xl font-black text-slate-800">{scan?.detected_issue}</h2>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Confidence</p>
                            <h2 className="text-3xl font-black text-mint-600">{(scan?.confidence_score * 100).toFixed(1)}%</h2>
                        </div>
                    </div>

                    {/* NEW: User Info Display */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-mint-100 flex items-center justify-center text-mint-600 font-bold text-xl border border-mint-200">
                            {scan?.user_name ? scan.user_name[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Patient</p>
                            <h3 className="text-lg font-bold text-slate-800">{scan?.user_name || "Anonymous User"}</h3>
                            <p className="text-sm text-slate-500">{scan?.user_email || "No email available"}</p>
                        </div>
                    </div>

                    {/* NEW: AI Summary Display */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">AI Summary</p>
                        <p className="text-slate-700 leading-relaxed font-medium">
                            {scan?.summary || "No summary available."}
                        </p>
                    </div>
                </div>

                {/* AI Draft Summaries & Actions */}
                <div className="flex flex-col gap-6">
                    <div className="bg-[#0f172a] text-white p-8 rounded-[2.5rem] relative overflow-hidden shadow-xl shadow-mint-900/10">
                        <Sparkles className="absolute top-4 right-4 text-mint-500 opacity-20" size={100} />
                        <h3 className="text-xl font-bold mb-4 relative z-10 flex items-center gap-2"><Sparkles size={20} className="text-mint-400" /> AI Generation Status</h3>

                        {aiLoading ? (
                            <div className="animate-pulse space-y-3 relative z-10">
                                <div className="h-2 bg-slate-700 rounded w-3/4"></div>
                                <div className="h-2 bg-slate-700 rounded w-1/2"></div>
                                <p className="text-mint-400 text-sm mt-4">Generating personalized routine...</p>
                            </div>
                        ) : (
                            <div className="relative z-10 space-y-4">
                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <div>
                                        <p className="text-slate-400 text-xs font-bold uppercase">Products Drafted</p>
                                        <p className="text-2xl font-bold text-white">{products.length}</p>
                                    </div>
                                    <button onClick={() => setCurrentView('products')} className="px-4 py-2 bg-mint-500 text-white rounded-xl text-xs font-black hover:bg-mint-600 transition-colors">EDIT</button>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <div>
                                        <p className="text-slate-400 text-xs font-bold uppercase">Remedies Drafted</p>
                                        <p className="text-2xl font-bold text-white">{remedies.length}</p>
                                    </div>
                                    <button onClick={() => setCurrentView('remedies')} className="px-4 py-2 bg-mint-500 text-white rounded-xl text-xs font-black hover:bg-mint-600 transition-colors">EDIT</button>
                                </div>

                            </div>
                        )}
                    </div>

                    <div className="flex-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-end gap-3">
                        <p className="text-slate-400 text-sm font-medium mb-4">
                            Review the AI generated drafts using the buttons above. Once satisfied, click Verify to save to database.
                        </p>
                        <button
                            onClick={handleSave}
                            disabled={aiLoading || isSent || isFlagged}
                            className="w-full py-4 bg-[#0f172a] hover:bg-slate-800 text-white rounded-2xl font-black text-lg shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            <Save size={24} /> {scan?.is_reviewed ? "SAVE CHANGES" : "SAVE DRAFT"}
                        </button>

                        {isFlagged ? (
                            <div className="w-full py-4 bg-orange-100 text-orange-700 rounded-2xl font-black text-lg text-center border-2 border-orange-200 flex items-center justify-center gap-2">
                                <AlertTriangle size={20} /> FLAGGED AS INCORRECT
                            </div>
                        ) : scan?.is_reviewed && !isSent ? (
                            <button
                                onClick={handleSend}
                                className="w-full py-4 bg-mint-500 hover:bg-mint-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-mint-200 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] animate-in slide-in-from-bottom-2"
                            >
                                <Check size={24} /> SEND TO USER
                            </button>
                        ) : null}

                        {isSent && (
                            <div className="w-full py-4 bg-mint-100 text-mint-700 rounded-2xl font-black text-lg text-center border-2 border-mint-200">
                                <Check size={20} className="inline mr-2" /> RESPONSE SENT
                            </div>
                        )}
                        <button
                            onClick={handleFlag}
                            disabled={isFlagged || isSent}
                            className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${isFlagged
                                ? 'bg-red-100 text-red-700 border-2 border-red-200 cursor-not-allowed'
                                : 'bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 hover:border hover:border-red-200'
                                }`}
                        >
                            <Flag size={20} />
                            {isFlagged ? 'Flagged as Incorrect' : 'Flag as Incorrect'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderProductEditor = () => (
        <div className="animate-in slide-in-from-right duration-300 space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    <Package className="text-mint-600" /> Manage Products
                </h3>
                <button onClick={() => setCurrentView('main')} className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-600 hover:bg-slate-200">Back to Overview</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((p, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative group">
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => {
                                const newProducts = products.filter((_, i) => i !== idx);
                                setProducts(newProducts);
                            }} className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100"><Trash2 size={16} /></button>
                        </div>
                        <h4 className="font-bold text-lg text-slate-800 mb-2">{p.title}</h4>
                        <p className="text-sm text-slate-500 p-3 bg-slate-50 rounded-xl">{p.description}</p>
                    </div>
                ))}
                <button
                    onClick={() => {
                        const name = prompt("Enter Product Name:");
                        if (name) {
                            const desc = prompt("Enter Description:");
                            setProducts([...products, { title: name, description: desc || "", type: "Product" }]);
                        }
                    }}
                    className="border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 p-8 hover:border-mint-400 hover:text-mint-500 hover:bg-mint-50 transition-all gap-2"
                >
                    <Plus size={32} />
                    <span className="font-bold">Add Product manually</span>
                </button>
            </div>
        </div>
    );

    const renderRemedyEditor = () => (
        <div className="animate-in slide-in-from-right duration-300 space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    <Leaf className="text-mint-600" /> Manage Remedies
                </h3>
                <button onClick={() => setCurrentView('main')} className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-600 hover:bg-slate-200">Back to Overview</button>
            </div>

            <div className="space-y-4">
                {/* Routine Summary Editor */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h4 className="font-bold text-lg text-slate-800 mb-2 flex items-center gap-2"><Sparkles size={16} className="text-mint-500" /> Daily Routine Summary</h4>
                    <textarea
                        value={routineSummary}
                        onChange={(e) => setRoutineSummary(e.target.value)}
                        className="w-full h-24 p-4 bg-slate-50 rounded-xl border-none resize-none focus:ring-2 focus:ring-mint-500"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {remedies.map((r, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative group">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => {
                                    const newRemedies = remedies.filter((_, i) => i !== idx);
                                    setRemedies(newRemedies);
                                }} className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100"><Trash2 size={16} /></button>
                            </div>
                            <h4 className="font-bold text-lg text-slate-800 mb-2">{r.title}</h4>
                            <p className="text-sm text-slate-500 p-3 bg-slate-50 rounded-xl">{r.description}</p>
                        </div>
                    ))}
                    <button
                        onClick={() => {
                            const name = prompt("Enter Remedy Name:");
                            if (name) {
                                const desc = prompt("Enter Ingredients/Instructions:");
                                setRemedies([...remedies, { title: name, description: desc || "", type: "Remedy" }]);
                            }
                        }}
                        className="border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 p-8 hover:border-mint-400 hover:text-mint-500 hover:bg-mint-50 transition-all gap-2"
                    >
                        <Plus size={32} />
                        <span className="font-bold">Add Remedy manually</span>
                    </button>
                </div>
            </div>
        </div >
    );



    if (loading) return <div className="min-h-screen flex items-center justify-center text-mint-600 font-bold">Loading Scan Data...</div>;

    return (
        <div className="p-8 min-h-screen bg-slate-50/50">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-full shadow-sm hover:scale-110 transition-transform">
                        <ArrowLeft size={20} className="text-slate-400" />
                    </button>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900">Scan Verification</h2>
                        <p className="text-slate-400 font-medium">Review AI suggestions before publishing.</p>
                    </div>
                </div>

                {currentView === 'main' && renderMainView()}
                {currentView === 'products' && renderProductEditor()}
                {currentView === 'remedies' && renderRemedyEditor()}

            </div>
        </div>
    );
};

export default ScanVerification;
