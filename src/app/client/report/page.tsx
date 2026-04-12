"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Upload, X, Copy, CheckCheck, Tag } from 'lucide-react';
import { gooeyToast } from 'goey-toast';
import { useQuery } from '@tanstack/react-query';
import BackButton from '@/components/navigation/back-button';

const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    // Check for auth-token in cookies on the client side
    if (typeof document !== 'undefined') {
      const hasToken = document.cookie.split('; ').find(row => row.startsWith('auth-token='));
      if (hasToken) {
        setIsLoggedIn(true);
        // Mock user details or read from local storage / another cookie ideally
        setUser({ name: 'John Doe', email: 'john@example.com' });
      }
    }
  }, []);

  return { isLoggedIn, user };
};

interface Barangay {
  id: string;
  name: string;
}

interface Municipality {
  id: string;
  name: string;
  barangays: Barangay[];
}

interface LocationData {
  municipalities: Municipality[];
}

interface FormData {
  // Step 1: Issue Type
  issueType: string;
  otherSpecify: string;
  
  // Step 2: Location
  municipality: string;
  barangay: string;
  location: string;
  landmark: string;
  
  // Step 3: Details
  title: string;
  description: string;
  urgency: string;
  photos: File[];
  
  // Step 4: Contact (maps to reporter_name, reporter_email, reporter_phone, is_anonymous)
  reporterName: string;
  reporterEmail: string;
  reporterPhone: string;
  anonymous: boolean;
}

export default function ReportPage() {
  const {
    data: locationData,
    isLoading: isLoadingLocations
  } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const res = await fetch('http://localhost:5000/api/v1/locations');
      if (!res.ok) throw new Error('Failed to fetch locations');
      const json = await res.json();
      return { municipalities: json.data } as LocationData;
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isLoggedIn, user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    issueType: '',
    otherSpecify: '',
    municipality: '',
    barangay: '',
    location: '',
    landmark: '',
    title: '',
    description: '',
    urgency: 'medium',
    photos: [],
    reporterName: '',
    reporterEmail: '',
    reporterPhone: '',
    anonymous: false,
  });

  // If user is logged in, skip step 4 (contact info)
  const totalSteps = isLoggedIn ? 3 : 4;

  const getProgressWidthClass = () => {
    if (totalSteps === 3) {
      if (currentStep === 1) return 'w-1/3';
      if (currentStep === 2) return 'w-2/3';
      return 'w-full';
    }

    if (currentStep === 1) return 'w-1/4';
    if (currentStep === 2) return 'w-1/2';
    if (currentStep === 3) return 'w-3/4';
    return 'w-full';
  };

  // Phone number formatter for Philippine format
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // If it starts with 63, add +
    if (digits.startsWith('63')) {
      const remaining = digits.slice(2, 12); // Max 10 digits after 63
      return '+63' + remaining;
    }
    
    // If it starts with 0, replace with +63
    if (digits.startsWith('0')) {
      const remaining = digits.slice(1, 11); // Max 10 digits after 0
      return '+63' + remaining;
    }
    
    // Otherwise, add +63 prefix
    const limited = digits.slice(0, 10); // Max 10 digits
    return limited ? '+63' + limited : '';
  };

  const updateFormData = (field: keyof FormData, value: string | boolean | File[]) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Reset dependent fields when municipality changes
      if (field === 'municipality') {
        updated.barangay = '';
      }

      // Clear reporter identity fields when switching to anonymous
      if (field === 'anonymous' && value === true) {
        updated.reporterName = '';
        updated.reporterEmail = '';
      }
      
      return updated;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const totalFiles = [...formData.photos, ...newFiles].slice(0, 5);
      updateFormData('photos', totalFiles);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = formData.photos.filter((_, i) => i !== index);
    updateFormData('photos', newPhotos);
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Generate a mock tracking number in RPT-XXXX format (matches schema reports.id)
  const generateTrackingNumber = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `RPT-${num}`;
  };

  const handleCopyTracking = async () => {
    if (!trackingNumber) return;
    await navigator.clipboard.writeText(trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const submissionData = { ...formData };

      // If user is logged in, use their info automatically
      if (isLoggedIn && user) {
        submissionData.reporterName = user.name;
        submissionData.reporterEmail = user.email;
      }

      // Convert formData to backend format
      const payload = {
        issue_type: formData.issueType,
        other_type_specification: formData.otherSpecify,
        title: formData.title,
        description: formData.description,
        municipality_id: formData.municipality,
        barangay_id: formData.barangay,
        location: formData.location,
        landmark: formData.landmark,
        urgency: formData.urgency,
        is_anonymous: formData.anonymous,
        reporter_name: submissionData.reporterName,
        reporter_email: submissionData.reporterEmail,
        reporter_phone: submissionData.reporterPhone,
        photos: [] // Placeholder until file upload service implemented
      };

      const res = await fetch('http://localhost:5000/api/v1/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Failed to create report on the server');
      }

      const { data } = await res.json();
      console.log('Form submitted successfully:', data);

      // Show tracking number modal
      setTrackingNumber(data.id);
      setCurrentStep(5);
      gooeyToast.success("Report Submitted", {
        description: `Your tracking ID is ${data.id}`
      });
    } catch (error) {
      gooeyToast.error("Submission Failed", {
        description: "We could not submit your report. Please review the details and try again.",
      });
      console.error('Report submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const issueTypes = [
    { value: 'infrastructure', label: 'Infrastructure', icon: 'construction' },
    { value: 'sanitation', label: 'Sanitation', icon: 'recycling' },
    { value: 'safety', label: 'Safety & Security', icon: 'emergency' },
    { value: 'traffic', label: 'Traffic', icon: 'traffic' },
    { value: 'utilities', label: 'Utilities', icon: 'power' },
    { value: 'environment', label: 'Environment', icon: 'park' },
    { value: 'other', label: 'Other', icon: 'description' },
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' },
  ];

  // Get available barangays based on selected municipality
  const availableBarangays = useMemo(() => {
    if (!formData.municipality || !locationData?.municipalities) return [];
    const municipality = locationData.municipalities.find(
      m => m.id === formData.municipality
    );
    return municipality?.barangays || [];
  }, [formData.municipality, locationData]);

  return (
    <>
      {/* Material Icons Link */}
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        rel="stylesheet"
      />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="max-w-xl mx-auto flex items-center justify-between">
            <BackButton
              fallbackPath={isLoggedIn ? "/client" : "/"}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
            />
            
            <Link href="/" className="flex items-center gap-2">
              <Image 
                src="/assets/logo.svg" 
                alt="SeeBu Logo" 
                width={32} 
                height={32}
                className="w-8 h-8"
              />
              <span className="text-lg font-bold text-gray-900 dark:text-white">SeeBu</span>
            </Link>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="p-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {Math.round((currentStep / totalSteps) * 100)}% Complete
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-primary transition-all duration-300 ease-out ${getProgressWidthClass()}`}
              />
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-xl mx-auto">
            
            {/* Step 1: Issue Type */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    What type of issue are you reporting?
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Select the category that best describes your concern.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {issueTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => {
                        updateFormData('issueType', type.value);
                        if (type.value !== 'other') {
                          updateFormData('otherSpecify', '');
                        }
                      }}
                      className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                        formData.issueType === type.value
                          ? 'border-primary bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-4xl mb-2 text-primary">
                        {type.icon}
                      </span>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {type.label}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Other Specify Input */}
                {formData.issueType === 'other' && (
                  <div className="animate-fade-in floating-input">
                    <input
                      id="otherSpecify"
                      type="text"
                      value={formData.otherSpecify}
                      onChange={(e) => updateFormData('otherSpecify', e.target.value)}
                      placeholder=" "
                      required
                    />
                    <label htmlFor="otherSpecify">Please specify *</label>
                    <span className="material-symbols-outlined input-icon">edit</span>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Location */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Where is the issue located?
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Help us find the exact location of the problem.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Municipality/City *
                    </label>
                    <select
                      value={formData.municipality}
                      onChange={(e) => updateFormData('municipality', e.target.value)}
                      title="Select municipality"
                      disabled={isLoadingLocations}
                      className="report-select w-full px-4 py-3 pr-10 rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all appearance-none disabled:opacity-50"
                    >
                      <option value="">{isLoadingLocations ? 'Loading areas...' : 'Select Municipality/City'}</option>
                      {locationData?.municipalities?.map((municipality) => (
                        <option key={municipality.id} value={municipality.id}>
                          {municipality.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.municipality && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Barangay *
                      </label>
                      <select
                        value={formData.barangay}
                        onChange={(e) => updateFormData('barangay', e.target.value)}
                        title="Select barangay"
                        disabled={isLoadingLocations || !availableBarangays.length}
                        className="report-select w-full px-4 py-3 pr-10 rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all appearance-none disabled:opacity-50"
                      >
                        <option value="">Select Barangay</option>
                        {availableBarangays?.map((barangay) => (
                          <option key={barangay.id} value={barangay.id}>
                            {barangay.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="floating-input">
                    <input
                      id="location"
                      type="text"
                      value={formData.location}
                      onChange={(e) => updateFormData('location', e.target.value)}
                      placeholder=" "
                      required
                    />
                    <label htmlFor="location">Street Address *</label>
                    <span className="material-symbols-outlined input-icon">location_on</span>
                  </div>

                  <div className="floating-input">
                    <input
                      id="landmark"
                      type="text"
                      value={formData.landmark}
                      onChange={(e) => updateFormData('landmark', e.target.value)}
                      placeholder=" "
                    />
                    <label htmlFor="landmark">Nearby Landmark (Optional)</label>
                    <span className="material-symbols-outlined input-icon">place</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Details */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Tell us more about the issue
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Provide details to help us understand and resolve the problem.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="floating-input">
                    <input
                      id="title"
                      type="text"
                      value={formData.title}
                      onChange={(e) => updateFormData('title', e.target.value)}
                      placeholder=" "
                      required
                    />
                    <label htmlFor="title">Issue Title *</label>
                    <span className="material-symbols-outlined input-icon">title</span>
                  </div>

                  <div className="floating-input">
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => updateFormData('description', e.target.value)}
                      placeholder=" "
                      rows={5}
                      required
                      className="resize-none"
                    />
                    <label htmlFor="description">Description *</label>
                    <span className="material-symbols-outlined input-icon">description</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Urgency Level *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {urgencyLevels.map((level) => (
                        <button
                          key={level.value}
                          onClick={() => updateFormData('urgency', level.value)}
                          className={`px-4 py-3 rounded-lg border-2 font-medium transition-all hover:scale-105 ${
                            formData.urgency === level.value
                              ? level.color
                              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {level.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Upload Photos (Max 5)
                    </label>
                    <div className="space-y-3">
                      {formData.photos.length < 5 && (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-gray-400" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Click to upload ({formData.photos.length}/5)
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={handleFileUpload}
                          />
                        </label>
                      )}

                      {/* Photo Previews */}
                      {formData.photos.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {formData.photos.map((file, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg"
                              />
                              <button
                                onClick={() => removePhoto(index)}
                                title="Remove photo"
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Contact */}
            {currentStep === 4 && !isLoggedIn && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Choose how to submit
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Report anonymously or provide your contact info for better tracking.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Anonymous Toggle */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.anonymous}
                        onChange={(e) => updateFormData('anonymous', e.target.checked)}
                        className="mt-1 w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          Report Anonymously
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Your identity will be kept confidential.
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Non-anonymous: name + email + phone */}
                  {!formData.anonymous && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="floating-input">
                        <input
                          id="reporterName"
                          type="text"
                          value={formData.reporterName}
                          onChange={(e) => updateFormData('reporterName', e.target.value)}
                          placeholder=" "
                          required
                        />
                        <label htmlFor="reporterName">Full Name *</label>
                        <span className="material-symbols-outlined input-icon">person</span>
                      </div>

                      <div className="floating-input">
                        <input
                          id="reporterEmail"
                          type="email"
                          value={formData.reporterEmail}
                          onChange={(e) => updateFormData('reporterEmail', e.target.value)}
                          placeholder=" "
                          required
                        />
                        <label htmlFor="reporterEmail">Email Address *</label>
                        <span className="material-symbols-outlined input-icon">mail</span>
                      </div>

                      <div className="floating-input">
                        <input
                          id="reporterPhone"
                          type="tel"
                          value={formData.reporterPhone}
                          onChange={(e) => {
                            const formatted = formatPhoneNumber(e.target.value);
                            updateFormData('reporterPhone', formatted);
                          }}
                          placeholder=" "
                          maxLength={13}
                        />
                        <label htmlFor="reporterPhone">Phone Number (Optional)</label>
                        <span className="material-symbols-outlined input-icon">phone</span>
                      </div>
                    </div>
                  )}

                  {/* Anonymous: phone only */}
                  {formData.anonymous && (
                    <div className="floating-input animate-fade-in">
                      <input
                        id="reporterPhone"
                        type="tel"
                        value={formData.reporterPhone}
                        onChange={(e) => {
                          const formatted = formatPhoneNumber(e.target.value);
                          updateFormData('reporterPhone', formatted);
                        }}
                        placeholder=" "
                        maxLength={13}
                      />
                      <label htmlFor="reporterPhone">Contact Number (Optional)</label>
                      <span className="material-symbols-outlined input-icon">phone</span>
                    </div>
                  )}

                  {/* Register Account Section */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-primary text-xl">account_circle</span>
                      <div className="flex-1">
                        <Link 
                          href="/auth/register"
                          className="font-semibold text-primary hover:text-primary/80 transition-colors"
                        >
                          Register an account
                        </Link>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          This helps us review and validate your report.
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Already have an account?{' '}
                      <Link 
                        href="/auth/login"
                        className="font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        Log in
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="p-6 pb-28 md:pb-6 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 mt-auto">
          <div className="max-w-xl mx-auto flex gap-3">
            {currentStep > 1 && (
              <button
                onClick={handlePrevious}
                className="flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                <ChevronLeft size={20} />
                Previous
              </button>
            )}
            
            {currentStep < totalSteps ? (
              <button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && (!formData.issueType || (formData.issueType === 'other' && !formData.otherSpecify))) ||
                  (currentStep === 2 && (!formData.municipality || !formData.barangay || !formData.location)) ||
                  (currentStep === 3 && (!formData.title || !formData.description))
                }
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight size={20} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || (!isLoggedIn && !formData.anonymous && (!formData.reporterName.trim() || !formData.reporterEmail.trim()))}
                className="flex-1 px-6 py-3 rounded-lg bg-secondary text-white font-medium hover:bg-secondary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Image (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-white dark:from-gray-900 dark:to-gray-800 items-center justify-center p-12">
        <div className="max-w-xl">
          <Image
            src="/gifs/info.gif"
            alt="Report Issue Illustration"
            width={600}
            height={600}
            unoptimized
            className="w-full h-auto"
          />
        </div>
      </div>
    </div>
    <div className="md:hidden block">

    </div>

    {/* Tracking Number Success Modal */}
    {trackingNumber && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm w-full p-8 flex flex-col items-center gap-5 border border-gray-100 dark:border-gray-800">
          {/* Success icon */}
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40">
            <span className="material-symbols-outlined text-4xl text-green-600 dark:text-green-400">check_circle</span>
          </div>

          <div className="text-center space-y-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Report Submitted!</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your report has been received. Use the tracking number below to monitor its status.
            </p>
          </div>

          {/* Tracking Number Display */}
          <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-primary/40 p-4 flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              <Tag size={12} />
              Tracking Number
            </div>
            <div className="text-3xl font-black text-primary tracking-widest">{trackingNumber}</div>
            <button
              onClick={handleCopyTracking}
              className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-primary transition-colors mt-1"
            >
              {copied ? (
                <><CheckCheck size={13} className="text-green-500" /> Copied!</>
              ) : (
                <><Copy size={13} /> Copy to clipboard</>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            Save this number — you&apos;ll need it to track your report.
          </p>

          <div className="flex flex-col w-full gap-2">
            <Link
              href="/track"
              className="w-full text-center px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-all"
            >
              Track My Report
            </Link>
            <Link
              href={isLoggedIn ? "/client" : "/"}
              onClick={() => setTrackingNumber(null)}
              className="w-full text-center px-6 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
