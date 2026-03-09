import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, User, Mail, Lock, Calendar, Smile, AlertTriangle, CheckCircle2, X } from "lucide-react";
import UserAuthLayout from "../../components/UserAuthLayout";
import { useToast } from "../../context/ToastContext";

const UserRegister = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        birth_date: "",
        gender: "",
        skin_type: "",
        allergies: [],
    });
    const [allergyInput, setAllergyInput] = useState("");
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAddAllergy = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCurrentAllergy();
        }
    };

    const addCurrentAllergy = () => {
        const newAllergy = allergyInput.trim();
        if (newAllergy && !formData.allergies.includes(newAllergy)) {
            setFormData({ ...formData, allergies: [...formData.allergies, newAllergy] });
            setAllergyInput("");
        }
    };

    const removeAllergy = (indexToRemove) => {
        setFormData({
            ...formData,
            allergies: formData.allergies.filter((_, index) => index !== indexToRemove)
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("http://localhost:5001/api/user/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                addToast("Registration successful! Please log in.", "success");
                navigate("/user/login");
            } else {
                addToast(data.message || "Registration failed", "error");
            }
        } catch (err) {
            addToast("Server error. Please try again later.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <UserAuthLayout
            title="Create Account"
            subtitle="Join us for a personalized AI skin analysis."
            sideImage="/assets/register_side_image.png"
            maxWidth="max-w-6xl"
            imageOverlay={
                <div className="w-full flex justify-center pb-6">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-full flex items-center gap-3 shadow-lg hover:bg-white/20 transition-all cursor-default group">
                        <span className="text-white/90 text-sm font-medium">Already have an account?</span>
                        <Link to="/user/login" className="text-white font-bold text-sm hover:text-mint-200 transition-colors flex items-center gap-1">
                            Log in <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>
                </div>
            }
        >


            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-5">
                {/* Name */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wide">Full Name</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <User className="w-4 h-4 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800 text-sm"
                            placeholder="John Doe"
                        />
                    </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wide">Email</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Mail className="w-4 h-4 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                        </div>
                        <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800 text-sm"
                            placeholder="john@example.com"
                        />
                    </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wide">Password</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock className="w-4 h-4 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                        </div>
                        <input
                            type="password"
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800 text-sm"
                            placeholder="Create a strong password"
                        />
                    </div>
                </div>

                {/* Birth Date */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wide">Date of Birth</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Calendar className="w-4 h-4 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                        </div>
                        <input
                            type="date"
                            name="birth_date"
                            required
                            value={formData.birth_date}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-gray-600 text-sm"
                        />
                    </div>
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wide">Gender</label>
                    <div className="relative">
                        <select
                            name="gender"
                            required
                            value={formData.gender}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-gray-600 appearance-none text-sm"
                        >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                        </div>
                    </div>
                </div>

                {/* Skin Type */}
                <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wide">Skin Type</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Smile className="w-4 h-4 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                        </div>
                        <select
                            name="skin_type"
                            required
                            value={formData.skin_type}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-gray-600 appearance-none text-sm"
                        >
                            <option value="">Select Skin Type</option>
                            <option value="Oily">Oily</option>
                            <option value="Dry">Dry</option>
                            <option value="Combination">Combination</option>
                            <option value="Sensitive">Sensitive</option>
                            <option value="Normal">Normal</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                        </div>
                    </div>

                    {/* Allergies - Optional */}
                    <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wide">Allergies (Optional)</label>
                        <div className="relative group flex items-center gap-2">
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <AlertTriangle className="w-4 h-4 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={allergyInput}
                                    onChange={(e) => setAllergyInput(e.target.value)}
                                    onKeyDown={handleAddAllergy}
                                    className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400 text-gray-800 text-sm"
                                    placeholder="Type allergy and press Enter or Add"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={addCurrentAllergy}
                                className="px-4 py-3 bg-teal-100 text-teal-700 hover:bg-teal-200 rounded-xl font-bold transition-colors"
                            >
                                Add
                            </button>
                        </div>
                        {formData.allergies.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2 pl-1">
                                {formData.allergies.map((allergy, index) => (
                                    <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-100 text-sm font-medium animate-in zoom-in duration-200">
                                        {allergy}
                                        <button
                                            type="button"
                                            onClick={() => removeAllergy(index)}
                                            className="p-0.5 hover:bg-red-200 rounded-full transition-colors focus:outline-none"
                                        >
                                            <X size={14} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="md:col-span-2 pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-mint-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-mint-200/50 transition-all transform hover:-translate-y-0.5 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        {loading ? "Creating Account..." : "Create Free Account"}
                        {!loading && <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                    </button>
                </div>

            </form>


        </UserAuthLayout >
    );
};

export default UserRegister;
