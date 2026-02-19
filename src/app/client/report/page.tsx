"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ChevronLeft, ChevronRight, Upload, X } from 'lucide-react';
import locationDataImport from './data.json';

// Simulated auth state - in production, this would come from your auth provider
const useAuth = () => {
  // For demonstration, change this to true to simulate logged-in user
  const [isLoggedIn] = useState(false);
  const [user] = useState(isLoggedIn ? { name: 'John Doe', email: 'john@example.com' } : null);
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

const locationData = locationDataImport as unknown as LocationData;

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
  
  // Step 4: Contact
  name: string;
  email: string;
  phone: string;
  anonymous: boolean;
  contactNumber: string;
}

export default function ReportIssuePage() {
  const { isLoggedIn, user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
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
    name: '',
    email: '',
    phone: '',
    anonymous: false,
    contactNumber: '',
  });

  // If user is logged in, skip step 4 (contact info)
  const totalSteps = isLoggedIn ? 3 : 4;

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

  const handleSubmit = () => {
    const submissionData = { ...formData };
    
    // If user is logged in, use their info automatically
    if (isLoggedIn && user) {
      submissionData.name = user.name;
      submissionData.email = user.email;
    }
    
    console.log('Form submitted:', submissionData);
    // Handle form submission logic here
    alert('Issue reported successfully!');
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
    if (!formData.municipality) return [];
    const municipality = locationData.municipalities.find(
      m => m.id === formData.municipality
    );
    return municipality?.barangays || [];
  }, [formData.municipality]);

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
            <Link 
              href="/"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back</span>
            </Link>
            
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
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
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
                      className="w-full px-4 py-3 pr-10 rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all appearance-none"
                      style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em'}}
                    >
                      <option value="">Select Municipality/City</option>
                      {locationData.municipalities.map((municipality) => (
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
                        className="w-full px-4 py-3 pr-10 rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all appearance-none"
                        style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em'}}
                      >
                        <option value="">Select Barangay</option>
                        {availableBarangays.map((barangay) => (
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
                    Report anonymously or create an account for better tracking and validation.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.anonymous}
                        onChange={(e) => {
                          updateFormData('anonymous', e.target.checked);
                          if (!e.target.checked) {
                            updateFormData('contactNumber', '');
                          }
                        }}
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

                  {/* Optional Contact Number for Anonymous Reports */}
                  {formData.anonymous && (
                    <div className="floating-input">
                      <input
                        id="contactNumber"
                        type="tel"
                        value={formData.contactNumber}
                        onChange={(e) => {
                          const formatted = formatPhoneNumber(e.target.value);
                          updateFormData('contactNumber', formatted);
                        }}
                        placeholder=" "
                        maxLength={13}
                      />
                      <label htmlFor="contactNumber">Contact Number (Optional)</label>
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
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
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
                className="flex-1 px-6 py-3 rounded-lg bg-secondary text-white font-medium hover:bg-secondary-dark transition-all"
              >
                Submit Report
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Image (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 items-center justify-center p-12">
        <div className="max-w-xl">
          <Image
            src="/gifs/info.gif"
            alt="Report Issue Illustration"
            width={600}
            height={600}
            className="w-full h-auto"
          />
        </div>
      </div>
    </div>
    </>
  );
}
