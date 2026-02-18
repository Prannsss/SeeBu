"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ChevronLeft, ChevronRight, Upload, X } from 'lucide-react';

interface FormData {
  // Step 1: Issue Type
  issueType: string;
  otherSpecify: string;
  
  // Step 2: Location
  location: string;
  barangay: string;
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
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    issueType: '',
    otherSpecify: '',
    location: '',
    barangay: '',
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

  const totalSteps = 4;

  const updateFormData = (field: keyof FormData, value: string | boolean | File[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    console.log('Form submitted:', formData);
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

  // Complete list of 80 Cebu City Barangays
  const cebuCityBarangays = [
    'Adlaon', 'Agsungot', 'Apas', 'Babag', 'Bacayan', 'Banilad', 'Basak Pardo', 'Basak San Nicolas', 
    'Binaliw', 'Bonbon', 'Budlaan', 'Buhisan', 'Bulacao', 'Buot-Taup Pardo', 'Busay', 'Calamba', 
    'Cambinocot', 'Capitol Site', 'Carreta', 'Central', 'Cogon Pardo', 'Cogon Ramos', 'Day-as', 'Duljo Fatima',
    'Ermita', 'Guba', 'Guadalupe', 'Hipodromo', 'Inayawan', 'Kalubihan', 'Kalunasan', 'Kamagayan',
    'Kamputhaw', 'Kasambagan', 'Kinasang-an Pardo', 'Labangon', 'Lahug', 'Lorega San Miguel', 'Lusaran', 'Luz',
    'Mabini', 'Mabolo', 'Malubog', 'Mambaling', 'Pahina Central', 'Pahina San Nicolas', 'Pamutan', 'Pardo',
    'Pari-an', 'Paril', 'Pasil', 'Pit-os', 'Poblacion Pardo', 'Pulangbato', 'Pung-ol Sibugay', 'Punta Princesa',
    'Quiot Pardo', 'Sambag I', 'Sambag II', 'San Antonio', 'San Jose', 'San Nicolas Central', 'San Nicolas Proper', 'San Roque',
    'Santa Cruz', 'Sapangdaku', 'Sawang Calero', 'Sinsin', 'Sirao', 'Suba Pasil', 'Sudlon I', 'Sudlon II',
    'T. Padilla', 'Tabunan', 'Tagbao', 'Talamban', 'Taptap', 'Tejero', 'Tinago', 'Tisa',
    'To-ong Pardo', 'Zapatera'
  ];

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
                      className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
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
                  <div className="animate-fade-in">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Please specify *
                    </label>
                    <input
                      type="text"
                      value={formData.otherSpecify}
                      onChange={(e) => updateFormData('otherSpecify', e.target.value)}
                      placeholder="Describe the type of issue"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
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
                      Street Address *
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => updateFormData('location', e.target.value)}
                      placeholder="e.g., 123 Osmeña Boulevard"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Barangay *
                    </label>
                    <select
                      value={formData.barangay}
                      onChange={(e) => updateFormData('barangay', e.target.value)}
                      title="Select barangay"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    >
                      <option value="">Select Barangay</option>
                      {cebuCityBarangays.map((barangay) => (
                        <option key={barangay} value={barangay.toLowerCase().replace(/\s+/g, '-')}>
                          {barangay}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nearby Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.landmark}
                      onChange={(e) => updateFormData('landmark', e.target.value)}
                      placeholder="e.g., Near SM City Cebu"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Issue Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => updateFormData('title', e.target.value)}
                      placeholder="e.g., Broken streetlight on main road"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => updateFormData('description', e.target.value)}
                      placeholder="Describe the issue in detail..."
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                    />
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
                          className={`px-4 py-3 rounded-xl border-2 font-medium transition-all hover:scale-105 ${
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
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
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
            {currentStep === 4 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    How can we reach you?
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    We'll use this information to update you on the progress.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
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
                          Your identity will be kept confidential. We'll only use your contact info for updates.
                        </div>
                      </div>
                    </label>
                  </div>

                  {formData.anonymous ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Number to Contact *
                      </label>
                      <input
                        type="tel"
                        value={formData.contactNumber}
                        onChange={(e) => updateFormData('contactNumber', e.target.value)}
                        placeholder="+63 912 345 6789"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => updateFormData('name', e.target.value)}
                          placeholder="Juan Dela Cruz"
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => updateFormData('email', e.target.value)}
                          placeholder="juan@example.com"
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => updateFormData('phone', e.target.value)}
                          placeholder="+63 912 345 6789"
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </>
                  )}
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
                className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
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
                  (currentStep === 2 && (!formData.location || !formData.barangay)) ||
                  (currentStep === 3 && (!formData.title || !formData.description))
                }
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight size={20} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={
                  formData.anonymous ? !formData.contactNumber : (!formData.name || !formData.email || !formData.phone)
                }
                className="flex-1 px-6 py-3 rounded-xl bg-secondary text-white font-medium hover:bg-secondary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
