import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  Eye,
  X,
  Calendar,
  Fingerprint,
  Trash2,
  Sparkles,
  Leaf,
  Beaker,
  ClipboardList,
} from "lucide-react";

const ManageScans = () => {
  const navigate = useNavigate();
  const [scans, setScans] = useState([]);
  const [selectedScan, setSelectedScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [recommendation, setRecommendation] = useState("");
  const [recType, setRecType] = useState("Remedy"); // Default to Remedy for ENUM safety

  const fetchScans = () => {
    fetch("http://localhost:5000/api/admin/all-scans")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") setScans(data.scans);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchScans();
  }, []);

  const handleGenerateAI = (type) => {
    setAiLoading(true);
    setRecType(type);
    fetch("http://localhost:5000/api/admin/generate-routine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        issue: selectedScan.detected_issue,
        choice: type,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setRecommendation(data.routine);
        setAiLoading(false);
      })
      .catch(() => setAiLoading(false));
  };

  const handleVerify = (id) => {
    fetch(`http://localhost:5000/api/admin/verify-scan/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recommendation, type: recType }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setScans(
            scans.map((s) =>
              s.analysis_id === id ? { ...s, is_reviewed: true } : s,
            ),
          );
          if (selectedScan?.analysis_id === id) {
            setSelectedScan({ ...selectedScan, is_reviewed: true });
          }
          alert("Scan Verified and Stored in Database!");
        }
      })
      .catch((err) => alert("Error verifying scan. Check console."));
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this scan record?")) {
      fetch(`http://localhost:5000/api/admin/delete-scan/${id}`, {
        method: "DELETE",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "success")
            setScans(scans.filter((s) => s.analysis_id !== id));
        });
    }
  };

  return (
    <div className="p-8 min-h-screen bg-slate-50/50">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <ClipboardList className="text-indigo-600" size={32} /> Manage Skin
            Analysis
          </h2>
          <p className="text-slate-400 font-medium">
            Verify AI results and provide expert skincare routines.
          </p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100 font-bold text-slate-400 text-xs uppercase tracking-widest">
              <tr>
                <th className="px-6 py-5">Scan ID</th>
                <th className="px-6 py-5">Detection</th>
                <th className="px-6 py-5">AI Confidence</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {scans.map((scan) => (
                <tr
                  key={scan.analysis_id}
                  className="hover:bg-indigo-50/30 transition-all group"
                >
                  <td className="px-6 py-4 font-bold text-slate-400">
                    #{scan.analysis_id}
                  </td>
                  <td className="px-6 py-4 font-extrabold text-indigo-900 text-lg">
                    {scan.detected_issue}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-500">
                    {(scan.confidence_score * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${scan.is_reviewed
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                        }`}
                    >
                      {scan.is_reviewed ? "Verified" : "Pending Review"}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex justify-center gap-3">
                    <button
                      onClick={() => navigate(`/dashboard/verification/${scan.analysis_id}`)}
                      className="p-3 bg-white border border-slate-200 hover:text-indigo-600 rounded-2xl transition-all shadow-sm"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>

                    {/* UPDATED: VERIFY BUTTON ADDED TO TABLE */}
                    {!scan.is_reviewed && (
                      <button
                        onClick={() => handleVerify(scan.analysis_id)}
                        className="p-3 bg-indigo-600 hover:bg-indigo-700 rounded-2xl text-white shadow-lg shadow-indigo-200 transition-all"
                        title="Verify Now"
                      >
                        <Check size={18} />
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(scan.analysis_id)}
                      className="p-3 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all shadow-sm"
                      title="Delete Record"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {scans.length === 0 && !loading && (
            <div className="p-20 text-center text-slate-400 font-bold">
              No scan records found.
            </div>
          )}
        </div>
      </div>

      {selectedScan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[3.5rem] max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col md:flex-row h-[650px] animate-in zoom-in duration-300">
            <div className="md:w-1/2 bg-slate-900">
              <img
                src={
                  selectedScan?.image_path
                    ? `http://localhost:5000/uploads/${selectedScan.image_path.split("/").pop()}`
                    : ""
                }
                alt="Skin"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/600x600?text=No+Image+Found";
                }}
              />
            </div>

            <div className="md:w-1/2 p-12 flex flex-col overflow-y-auto">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">
                    Diagnosis Review
                  </h3>
                  <p className="text-4xl font-black text-slate-900">
                    {selectedScan.detected_issue}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedScan(null)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Confidence
                    </span>
                    <span className="text-2xl font-black text-indigo-600">
                      {(selectedScan.confidence_score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Captured On
                    </span>
                    <span className="text-lg font-bold text-slate-700">
                      {new Date(
                        selectedScan.analysis_date,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[11px] font-black text-indigo-500 uppercase tracking-widest block">
                    Expert Advice Generation
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleGenerateAI("Remedy")}
                      className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all ${recType === "Remedy" ? "bg-green-600 text-white" : "bg-green-50 text-green-700 border border-green-200"}`}
                    >
                      <Leaf size={16} /> Home Remedy
                    </button>
                    <button
                      onClick={() => handleGenerateAI("Product")}
                      className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all ${recType === "Product" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 border border-blue-200"}`}
                    >
                      <Beaker size={16} /> Products
                    </button>
                  </div>
                  <textarea
                    value={
                      aiLoading
                        ? "Gemini is analyzing the scan and generating an expert routine..."
                        : recommendation
                    }
                    onChange={(e) => setRecommendation(e.target.value)}
                    placeholder="Expert routine details will appear here..."
                    className="w-full h-40 bg-slate-50 border border-slate-200 rounded-[1.5rem] p-5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium text-slate-600"
                  />
                </div>
              </div>

              <div className="mt-8">
                {!selectedScan.is_reviewed ? (
                  <button
                    onClick={() => handleVerify(selectedScan.analysis_id)}
                    disabled={aiLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-200 active:scale-95 disabled:bg-slate-200"
                  >
                    <Sparkles size={20} /> Verify & Submit Expert Advice
                  </button>
                ) : (
                  <div className="w-full bg-green-50 border-2 border-green-100 text-green-600 font-black py-5 rounded-[2rem] flex items-center justify-center gap-3">
                    <Check size={20} /> Verified Successfully
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageScans;
