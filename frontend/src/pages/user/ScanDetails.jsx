
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, AlertCircle, AlertTriangle, Package, Leaf, Star } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const ScanDetails = () => {
    const { analysisId } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [scan, setScan] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(null); // 'Product' or 'Remedy'

    // Review states
    const [reviewRatings, setReviewRatings] = useState({}); // { [product_title]: rating }
    const [reviewTexts, setReviewTexts] = useState({}); // { [product_title]: text }
    const [reviewLoading, setReviewLoading] = useState({}); // { [product_title]: boolean }

    useEffect(() => {
        fetchScanDetails();
    }, [analysisId]);

    const fetchScanDetails = () => {
        setLoading(true);
        fetch(`http://localhost:5001/api/user/scan-details/${analysisId}`)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    setScan(data.scan);
                    setRecommendations(data.recommendations || []);

                    // Logic to show preference modal - REMOVED for Tab View
                    // if (data.scan.is_reviewed && data.scan.is_sent && !data.scan.user_preference) {
                    //     setShowPreferenceModal(true);
                    // }
                } else {
                    addToast(data.message || "Failed to load scan details", 'error');
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                addToast("Network error", 'error');
                setLoading(false);
            });
    };

    const handleReviewSubmit = (productName) => {
        const rating = reviewRatings[productName] || 0;
        const text = reviewTexts[productName] || '';
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user.user_id;

        if (!userId) {
            addToast("Please login to submit a review", "error");
            return;
        }
        if (rating === 0) {
            addToast("Please select a star rating", "error");
            return;
        }

        setReviewLoading(prev => ({ ...prev, [productName]: true }));

        fetch('http://localhost:5001/api/user/product-review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                product_name: productName,
                rating: rating,
                review_text: text
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    addToast("Review submitted successfully!", "success");

                    const newReview = {
                        user_name: user.name || "You",
                        rating: rating,
                        review_text: text,
                        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    };

                    setRecommendations(prevRecs =>
                        prevRecs.map(r => {
                            if (r.title === productName) {
                                return {
                                    ...r,
                                    can_review: false,
                                    reviews: [newReview, ...(r.reviews || [])]
                                };
                            }
                            return r;
                        })
                    );
                } else {
                    addToast(data.message || "Failed to submit review", "error");
                }
            })
            .catch(err => {
                console.error(err);
                addToast("Network error", "error");
            })
            .finally(() => {
                setReviewLoading(prev => ({ ...prev, [productName]: false }));
            });
    };

    if (loading && !scan) return <div className="min-h-screen flex items-center justify-center text-teal-600 font-bold">Loading...</div>;

    if (!scan) return <div className="min-h-screen flex items-center justify-center">Scan not found</div>;

    const renderSelectionGate = () => (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 h-full flex flex-col items-center justify-center text-center animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-gray-900 mb-6">Choose Recommendation Type</h3>
            <p className="text-gray-500 mb-8 max-w-sm">
                Our experts have prepared personalized advice. Select how you would like to treat your condition.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <button
                    onClick={() => setActiveTab('Product')}
                    className="group p-6 rounded-3xl border-2 border-indigo-50 hover:border-indigo-500 hover:bg-indigo-50 transition-all flex flex-col items-center gap-4"
                >
                    <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Package size={32} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 text-lg">Products</h4>
                        <p className="text-xs text-gray-500 mt-1">Medical & Cosmetic</p>
                    </div>
                </button>

                <button
                    onClick={() => setActiveTab('Remedy')}
                    className="group p-6 rounded-3xl border-2 border-green-50 hover:border-green-500 hover:bg-green-50 transition-all flex flex-col items-center gap-4"
                >
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Leaf size={32} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 text-lg">Remedies</h4>
                        <p className="text-xs text-gray-500 mt-1">Natural & Home-made</p>
                    </div>
                </button>
            </div>
        </div>
    );

    const renderRecommendations = () => (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 h-full animate-in fade-in slide-in-from-bottom-4">
            <div className="flex bg-gray-100 p-1 rounded-2xl mb-6">
                <button
                    onClick={() => setActiveTab('Product')}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'Product' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Package size={18} /> Products ({recommendations.filter(r => r.type === 'Product').length})
                </button>
                <button
                    onClick={() => setActiveTab('Remedy')}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'Remedy' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Leaf size={18} /> Remedies ({recommendations.filter(r => r.type === 'Remedy').length})
                </button>
            </div>

            <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-xl ${activeTab === 'Product' ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'}`}>
                    {activeTab === 'Product' ? <Package size={24} /> : <Leaf size={24} />}
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900">{activeTab === 'Product' ? "Recommended Products" : "Natural Remedies"}</h3>
                    <p className="text-sm text-gray-400">Curated by our experts</p>
                </div>
            </div>

            {recommendations.filter(r => r.type === activeTab).length > 0 ? (
                <div className="space-y-4">
                    {recommendations.filter(r => r.type === activeTab).map((rec, idx) => (
                        <div key={idx} className="bg-gray-50 p-5 rounded-2xl border border-gray-100 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-2 mb-2">
                                {rec.type === 'Product' ? <Package size={16} className="text-indigo-500" /> : <Leaf size={16} className="text-green-500" />}
                                <h4 className="font-bold text-gray-800">{rec.title}</h4>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">{rec.description}</p>

                            {/* Product Reviews Section */}
                            {rec.type === 'Product' && (
                                <div className="mt-5 border-t border-gray-200 pt-5">
                                    <h5 className="font-bold text-gray-700 mb-4 text-sm flex items-center gap-2">
                                        <Star size={16} className="text-amber-500" />
                                        User Reviews
                                    </h5>

                                    {/* Display existing reviews */}
                                    {rec.reviews && rec.reviews.length > 0 ? (
                                        <div className="space-y-3 mb-5">
                                            {rec.reviews.map((rev, i) => (
                                                <div key={i} className="bg-white p-4 rounded-xl shadow-sm text-sm border border-gray-100">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-bold text-gray-800">{rev.user_name}</span>
                                                        <span className="text-xs text-gray-400 font-medium">{rev.date}</span>
                                                    </div>
                                                    <div className="flex gap-1 mb-2">
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                            <Star key={star} size={14} className={star <= rev.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"} />
                                                        ))}
                                                    </div>
                                                    {rev.review_text && <p className="text-gray-600 leading-relaxed mt-1">{rev.review_text}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 italic mb-5">No reviews yet. Be the first to share your experience!</p>
                                    )}

                                    {/* Leave a review form (if eligible) */}
                                    {rec.can_review && (
                                        <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50">
                                            <h6 className="font-bold text-indigo-900 text-sm mb-3">Leave a Review</h6>
                                            <div className="flex gap-1 mb-4">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <button
                                                        key={star}
                                                        onClick={() => setReviewRatings(prev => ({ ...prev, [rec.title]: star }))}
                                                        className="hover:scale-110 transition-transform focus:outline-none"
                                                    >
                                                        <Star size={24} className={(reviewRatings[rec.title] || 0) >= star ? "fill-amber-400 text-amber-400" : "text-gray-300 hover:text-amber-200"} />
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea
                                                className="w-full text-sm p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all outline-none resize-none mb-3"
                                                rows="2"
                                                placeholder="Share your experience with this product (optional)..."
                                                value={reviewTexts[rec.title] || ''}
                                                onChange={e => setReviewTexts(prev => ({ ...prev, [rec.title]: e.target.value }))}
                                            ></textarea>
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => handleReviewSubmit(rec.title)}
                                                    disabled={reviewLoading[rec.title]}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2 px-6 rounded-xl transition-colors disabled:opacity-50 hover:shadow-md"
                                                >
                                                    {reviewLoading[rec.title] ? "Submitting..." : "Submit Review"}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-gray-400">
                    <p>No recommendations found for this category.</p>
                </div>
            )}

            <button onClick={() => setActiveTab(null)} className="mt-6 w-full py-2 text-slate-400 text-sm font-bold hover:text-slate-600">
                Back to Selection
            </button>
        </div>
    );

    return (
        <div className="bg-transparent animate-fade-in-up">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/user/dashboard')} className="p-3 bg-white rounded-full shadow-sm hover:scale-110 transition-transform">
                        <ArrowLeft size={20} className="text-gray-400" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Analysis Result</h1>
                        <p className="text-gray-500 text-sm">{scan.date}</p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Image and Diagnosis */}
                    <div className="space-y-6">
                        <div className="bg-white p-4 rounded-[2.5rem] shadow-sm border border-gray-100 h-full">
                            <div className="w-full aspect-[4/3] rounded-[2rem] overflow-hidden bg-gray-100 mb-6">
                                <img
                                    src={`http://localhost:5001/uploads/${scan.image_path.split('/').pop()}`}
                                    alt="Scan"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="px-4 pb-4">
                                {scan.is_reviewed ? (
                                    <>
                                        <h2 className="text-3xl font-black text-gray-900 mb-1">{scan.detected_issue}</h2>
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="text-sm font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                                                Confidence: {(scan.confidence * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-2xl">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">AI Summary</p>
                                            <p className="text-gray-700 leading-relaxed">{scan.summary}</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-6">
                                        <div className="animate-pulse flex justify-center mb-4">
                                            <div className="h-2 w-24 bg-gray-200 rounded"></div>
                                        </div>
                                        <p className="text-gray-500 font-medium">Analysis in progress...</p>
                                        <p className="text-xs text-gray-400 mt-1">Results will appear here after verification</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Selection Gate OR Recommendations */}
                    <div className="space-y-6 h-full">
                        {scan.is_flagged ? (
                            <div className="bg-orange-50 border-2 border-orange-200 p-8 rounded-[2.5rem] h-full flex flex-col items-center justify-center text-center">
                                <div className="p-4 bg-white text-orange-500 rounded-full shadow-md mb-6">
                                    <AlertTriangle size={40} />
                                </div>
                                <span className="inline-block px-4 py-1 bg-orange-100 text-orange-700 text-xs font-black uppercase tracking-widest rounded-full mb-4">⚑ Flagged as Incorrect</span>
                                <h3 className="text-2xl font-bold text-orange-900 mb-3">AI Result Not Accurate</h3>
                                <p className="text-orange-700 max-w-xs leading-relaxed">
                                    Our dermatology team reviewed your scan and determined the AI detection was likely inaccurate. This report will <strong>not</strong> be sent to you.
                                </p>
                                <p className="text-orange-600 text-sm mt-4 font-medium">
                                    Please retake your scan under better lighting conditions or consult a dermatologist directly.
                                </p>
                            </div>
                        ) : scan.is_reviewed && scan.is_sent ? (
                            activeTab ? renderRecommendations() : renderSelectionGate()
                        ) : (
                            <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[2.5rem] h-full flex flex-col items-center justify-center text-center">
                                <div className="p-4 bg-white text-indigo-600 rounded-full shadow-md mb-6 animate-pulse">
                                    <AlertCircle size={40} />
                                </div>
                                <h3 className="text-2xl font-bold text-indigo-900 mb-2">Review Pending</h3>
                                <p className="text-indigo-700 max-w-xs">
                                    Our dermatologists are currently reviewing your scan. Please check back later for your personalized report.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScanDetails;
