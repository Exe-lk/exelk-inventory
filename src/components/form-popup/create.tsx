
import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';


export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'phone' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'date' | 'number';
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: any }[];
  validation?: (value: any) => string | null;
  disabled?: boolean;
  defaultValue?: any;
  className?: string;
  rows?: number; // for textarea
  accept?: string;
}

export interface FormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  onClear?: () => void;
  submitButtonLabel?: string;
  clearButtonLabel?: string;
  title?: string;
  className?: string;
  loading?: boolean;
  initialData?: Record<string, any>;
  enableDynamicSpecs?: boolean; // New prop to enable dynamic specs
}

interface DynamicSpec {
  id: string;
  name: string;
  value: string;
  description?: string;
  dataType?: string;
  isActive?: boolean;
}

const Form: React.FC<FormProps> = ({
  fields,
  onSubmit,
  onClear,
  submitButtonLabel = 'Create',
  clearButtonLabel = 'Clear',
  title,
  className = '',
  loading = false,
  initialData = {},
  enableDynamicSpecs = false
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(
    fields.reduce((acc, field) => ({
      ...acc,
      [field.name]: initialData[field.name] || field.defaultValue || (field.type === 'checkbox' ? false : '')
    }), {})
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  
  // Dynamic specs state
  const [dynamicSpecs, setDynamicSpecs] = useState<DynamicSpec[]>([
    { id: '1', name: '', value: '', description: '', dataType: 'TEXT', isActive: true }
  ]);

  // const validateField = (field: FormField, value: any): string | null => {
  //   if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
  //     return `${field.label} is required`;
  //   }

  //   if (field.validation) {
  //     return field.validation(value);
  //   }

  //   // Built-in validations
  //   if (field.type === 'email' && value) {
  //     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //     if (!emailRegex.test(value)) {
  //       return 'Please enter a valid email address';
  //     }
  //   }

  //   if (field.type === 'phone' && value) {
  //     const phoneRegex = /^[0-9-+\s()]+$/;
  //     if (!phoneRegex.test(value)) {
  //       return 'Please enter a valid phone number';
  //     }
  //   }

  //   return null;
  // };

  

const validateField = (field: FormField, value: any): string | null => {
  // Handle required validation
  if (field.required) {
    // if (field.type === 'file') {
    //   if (!value || !(value instanceof File)) {
    //     return `${field.label} is required`;
    //   }
    // } else {
    //   if (!value || (typeof value === 'string' && value.trim() === '')) {
    //     return `${field.label} is required`;
    //   }
    // }
  }

  // Handle custom validation
  if (field.validation && value !== null && value !== undefined) {
    try {
      const validationResult = field.validation(value);
      if (validationResult) {
        return validationResult;
      }
    } catch (error) {
      console.error('Validation error:', error);
      return 'Validation failed';
    }
  }

  // Built-in validations for other field types
  if (field.type === 'email' && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
  }

  if (field.type === 'phone' && value) {
    const phoneRegex = /^[0-9-+\s()]+$/;
    if (!phoneRegex.test(value)) {
      return 'Please enter a valid phone number';
    }
  }

  return null;
};




// In your Form component, add debugging to the validation:

// const validateForm = (): boolean => {
//   const newErrors: Record<string, string | null> = {};
//   let isValid = true;

//   fields.forEach((field) => {
//     try {
//       const fieldValue = values[field.name];
//       console.log(`Validating field ${field.name}:`, fieldValue, typeof fieldValue);
      
//       const error = validateField(field, fieldValue);
//       if (error) {
//         newErrors[field.name] = error;
//         isValid = false;
//       }
//     } catch (error) {
//       console.error(`Error validating field ${field.name}:`, error);
//       newErrors[field.name] = 'Validation error occurred';
//       isValid = false;
//     }
//   });

//   setErrors(newErrors);
//   return isValid;
// };

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  // Dynamic specs handlers
  const addSpec = () => {
    const newId = Date.now().toString();
    setDynamicSpecs(prev => [...prev, { 
      id: newId, 
      name: '', 
      value: '', 
      description: '', 
      dataType: 'TEXT', 
      isActive: true 
    }]);
  };

  const removeSpec = (id: string) => {
    if (dynamicSpecs.length > 1) {
      setDynamicSpecs(prev => prev.filter(spec => spec.id !== id));
    }
  };

  const updateSpec = (id: string, field: keyof DynamicSpec, value: string | boolean) => {
    setDynamicSpecs(prev => prev.map(spec => 
      spec.id === id ? { ...spec, [field]: value } : spec
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        newErrors[field.name] = error;
      }
    });

    // Validate dynamic specs if enabled
    if (enableDynamicSpecs) {
      dynamicSpecs.forEach((spec, index) => {
        if (spec.name.trim() && !spec.value.trim()) {
          newErrors[`spec_${index}_value`] = 'Spec value is required when spec name is provided';
        }
        if (!spec.name.trim() && spec.value.trim()) {
          newErrors[`spec_${index}_name`] = 'Spec name is required when spec value is provided';
        }
      });
    }

    setErrors(newErrors);

    // If no errors, submit the form
    if (Object.keys(newErrors).length === 0) {
      // Merge form data with dynamic specs data
      const submissionData = { ...formData };
      
      if (enableDynamicSpecs) {
        dynamicSpecs.forEach((spec, index) => {
          if (spec.name.trim() && spec.value.trim()) {
            submissionData[`spec_${index}_name`] = spec.name;
            submissionData[`spec_${index}_value`] = spec.value;
            submissionData[`spec_${index}_description`] = spec.description || '';
            submissionData[`spec_${index}_dataType`] = spec.dataType || 'TEXT';
            submissionData[`spec_${index}_isActive`] = spec.isActive !== false;
          }
        });
      }
      
      onSubmit(submissionData);
    }
  };

  const handleClear = () => {
    const clearedData = fields.reduce((acc, field) => ({
      ...acc,
      [field.name]: field.type === 'checkbox' ? false : ''
    }), {});
    
    setFormData(clearedData);
    setErrors({});
    
    // Reset dynamic specs
    if (enableDynamicSpecs) {
      setDynamicSpecs([{ id: '1', name: '', value: '', description: '', dataType: 'TEXT', isActive: true }]);
    }
    
    if (onClear) {
      onClear();
    }
  };

  const togglePasswordVisibility = (fieldName: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  
  

  const renderField = (field: FormField) => {
    const hasError = !!errors[field.name];
    const baseInputClasses = `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
      hasError ? 'border-red-500' : 'border-gray-300'
    } ${field.disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`;

    switch (field.type) {
      case 'select':
        return (
          <div className="relative">
            <select
              value={formData[field.name] || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              className={`${baseInputClasses} appearance-none pr-10 ${
                !formData[field.name] ? 'text-gray-400' : 'text-gray-900'
              }`}
              disabled={field.disabled}
            >
              <option value="" disabled>
                {field.placeholder || `Select ${field.label}`}
              </option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value} className="text-gray-900">
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        );

      case 'textarea':
        return (
          <textarea
            value={formData[field.name] || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={field.rows || 4}
            className={baseInputClasses}
            disabled={field.disabled}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData[field.name] === true}
                onChange={(e) => handleInputChange(field.name, e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                disabled={field.disabled}
              />
              <span className="text-sm font-medium text-gray-700">Yes</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData[field.name] === false}
                onChange={(e) => handleInputChange(field.name, !e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                disabled={field.disabled}
              />
              <span className="text-sm font-medium text-gray-700">No</span>
            </label>
          </div>
        );

      case 'radio':
        return (
          <div className="flex flex-wrap gap-4">
            {field.options?.map((option) => (
              <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name={field.name}
                  value={option.value}
                  checked={formData[field.name] === option.value}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
                  disabled={field.disabled}
                />
                <span className="text-sm font-medium text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'password':
        return (
          <div className="relative">
            <input
              type={showPasswords[field.name] ? 'text' : 'password'}
              value={formData[field.name] || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={`${baseInputClasses} pr-12`}
              disabled={field.disabled}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility(field.name)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPasswords[field.name] ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={formData[field.name] || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={baseInputClasses}
            disabled={field.disabled}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={formData[field.name] || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClasses}
            disabled={field.disabled}
            step="any"
          />
        );

    //   case 'file':
    //     console.log('Rendering file input with accept:', field.accept);
    // return (
    //   <div className="mb-4">
        
    //     <input
    //       type="file"
    //       accept={field.accept}
    //       onChange={(e) => {
    //         const file = e.target.files?.[0] || null;
    //         console.log('File selected:', file?.name, file?.type);
    //         handleInputChange(field.name, file);
            
    //         // Clear any previous validation errors when a new file is selected
    //         if (file && errors[field.name]) {
    //           setErrors(prev => ({
    //             ...prev,
    //             [field.name]: ''
    //           }));
    //         }
    //       }}
    //       className="block w-full text-sm text-gray-500 
    //                 file:mr-4 file:py-2 file:px-4 
    //                 file:rounded-full file:border-0 
    //                 file:text-sm file:font-semibold 
    //                 file:bg-blue-50 file:text-blue-700 
    //                 hover:file:bg-blue-100
    //                 border border-gray-300 rounded-md
    //                 focus:ring-blue-500 focus:border-blue-500"
    //       disabled={field.disabled}
    //     />
    //     <p className="text-xs text-gray-500 mt-1">
    //     Accepted: {field.accept}
    //   </p>
    //     {formData[field.name] && (
    //       <p className="text-gray-600 text-xs mt-1">
    //         Selected: {(formData[field.name] as File).name}
    //       </p>
    //     )}
    //      {errors[field.name] && (
    //     <p className="text-red-500 text-xs mt-1">{errors[field.name]}</p>
    //   )}
    //   </div>
    // );




    
// case 'file':
//   console.log('Rendering file input with accept:', field.accept);
//   return (
//     <div className="mb-4">
//       <label className="block text-sm font-medium text-gray-700 mb-2">
//         {field.label}
//         {field.required && <span className="text-red-500 ml-1">*</span>}
//       </label>
//       <input
//         type="file"
//         accept={field.accept}
//         onChange={(e) => {
//           const file = e.target.files?.[0] || null;
//           console.log('File selected:', file?.name, file?.type);
//           handleInputChange(field.name, file);
          
//           if (file && errors[field.name]) {
//             setErrors(prev => ({
//               ...prev,
//               [field.name]: ''
//             }));
//           }
//         }}
//         className="block w-full text-sm text-gray-500 
//                    file:mr-4 file:py-2 file:px-4 
//                    file:rounded-full file:border-0 
//                    file:text-sm file:font-semibold 
//                    file:bg-blue-50 file:text-blue-700 
//                    hover:file:bg-blue-100
//                    border border-gray-300 rounded-md
//                    focus:ring-blue-500 focus:border-blue-500"
//         disabled={field.disabled}
//       />
//       <p className="text-xs text-gray-500 mt-1">
//         Accepted: {field.accept}
//       </p>
//       {formData[field.name] && (
//         <p className="text-gray-600 text-xs mt-1">
//           Selected: {(formData[field.name] as File).name}
//         </p>
//       )}
//       {errors[field.name] && (
//         <p className="text-red-500 text-xs mt-1">{errors[field.name]}</p>
//       )}
//     </div>
//   );



      default:
        return (
          <input
            type={field.type}
            value={formData[field.name] || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClasses}
            disabled={field.disabled}
          />
        );
    }
  };

  // Filter out spec fields from the original fields array if dynamic specs are enabled
  const filteredFields = enableDynamicSpecs 
    ? fields.filter(field => !field.name.startsWith('spec_'))
    : fields;

  return (
    <div className={`bg-white rounded-lg p-8 ${className}`}>
      {title && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {filteredFields.map((field) => (
            <div
              key={field.name}
              className={`${field.type === 'textarea' ? 'md:col-span-2' : ''} ${field.className || ''}`}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              
              {renderField(field)}
              
              {errors[field.name] && (
                <p className="mt-2 text-sm text-red-600">{errors[field.name]}</p>
              )}
            </div>
          ))}
        </div>

        {/* Dynamic Specifications Section */}
        {enableDynamicSpecs && (
          <div className="mb-8">
            <div className="border-t border-gray-200 pt-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Product Specifications</h3>
                  <p className="mt-1 text-sm text-gray-500">Add technical specifications for this product</p>
                </div>
                <button
                  type="button"
                  onClick={addSpec}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Spec
                </button>
              </div>

              <div className="space-y-4">
                {dynamicSpecs.map((spec, index) => (
                  <div key={spec.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Spec Name
                      </label>
                      <input
                        type="text"
                        value={spec.name}
                        onChange={(e) => updateSpec(spec.id, 'name', e.target.value)}
                        placeholder="Enter specification name (e.g., RAM, Storage)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      />
                      {errors[`spec_${index}_name`] && (
                        <p className="mt-2 text-sm text-red-600">{errors[`spec_${index}_name`]}</p>
                      )}
                    </div>
                    
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Spec Value
                      </label>
                      <div className="flex">
                        <input
                          type="text"
                          value={spec.value}
                          onChange={(e) => updateSpec(spec.id, 'value', e.target.value)}
                          placeholder="Enter specification value (e.g., 16GB, 512GB)"
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        />
                        {dynamicSpecs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSpec(spec.id)}
                            className="px-3 py-3 border border-l-0 border-gray-300 rounded-r-lg bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
                            title="Remove this specification"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {errors[`spec_${index}_value`] && (
                        <p className="mt-2 text-sm text-red-600">{errors[`spec_${index}_value`]}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleClear}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors duration-200 font-medium"
            disabled={loading}
          >
            {clearButtonLabel}
          </button>
          
          <button
            type="submit"
            className="px-6 py-3 bg-[#4154F1] text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            disabled={loading}
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            {submitButtonLabel}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Form;








// import React, { useState, useEffect } from 'react';
// import { EyeIcon, EyeSlashIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
// import { generateProductName, generateSKU, generateBarcode } from '@/lib/utils/productGenerators';
// import type { Brand, Model } from '@/lib/services/productService';

// export interface FormField {
//   name: string;
//   label: string;
//   type: 'text' | 'email' | 'password' | 'phone' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'date' | 'number';
//   placeholder?: string;
//   required?: boolean;
//   options?: { label: string; value: any }[];
//   validation?: (value: any) => string | null;
//   disabled?: boolean;
//   defaultValue?: any;
//   className?: string;
//   rows?: number; // for textarea
// }

// export interface FormProps {
//   fields: FormField[];
//   onSubmit: (data: Record<string, any>) => void;
//   onClear?: () => void;
//   submitButtonLabel?: string;
//   clearButtonLabel?: string;
//   title?: string;
//   className?: string;
//   loading?: boolean;
//   initialData?: Record<string, any>;
//   enableDynamicSpecs?: boolean; // New prop to enable dynamic specs
// }

// interface DynamicSpec {
//   id: string;
//   name: string;
//   value: string;
//   description?: string;
//   dataType?: string;
//   isActive?: boolean;
// }

// const Form: React.FC<FormProps> = ({
//   fields,
//   onSubmit,
//   onClear,
//   submitButtonLabel = 'Create',
//   clearButtonLabel = 'Clear',
//   title,
//   className = '',
//   loading = false,
//   initialData = {},
//   enableDynamicSpecs = false
// }) => {
//   const [formData, setFormData] = useState<Record<string, any>>(
//     fields.reduce((acc, field) => ({
//       ...acc,
//       [field.name]: initialData[field.name] || field.defaultValue || (field.type === 'checkbox' ? false : '')
//     }), {})
//   );

//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  
//   // Auto-generation state
//   const [isGeneratingSKU, setIsGeneratingSKU] = useState(false);
//   const [isGeneratingBarcode, setIsGeneratingBarcode] = useState(false);
  
//   // Dynamic specs state
//   const [dynamicSpecs, setDynamicSpecs] = useState<DynamicSpec[]>([
//     { id: '1', name: '', value: '', description: '', dataType: 'TEXT', isActive: true }
//   ]);

//   // Helper function to get field options
//   const getFieldOptions = (fieldName: string): any[] => {
//     const field = fields.find(f => f.name === fieldName);
//     return field?.options || [];
//   };

//   // Auto-generation functions
//   const handleGenerateProductName = () => {
//     const brandId = formData.brandId;
//     const modelId = formData.modelId;
    
//     if (!brandId || !modelId) {
//       alert('Please select both Brand and Model first');
//       return;
//     }
    
//     const brands = getFieldOptions('brandId') as Brand[];
//     const models = getFieldOptions('modelId') as Model[];
    
//     const productName = generateProductName({
//       brandId,
//       modelId,
//       color: formData.color || '',
//       brands,
//       models
//     });
    
//     if (productName) {
//       setFormData(prev => ({ ...prev, productName }));
//     }
//   };

//   const handleGenerateSKU = () => {
//     const { brandId, modelId, color } = formData;
    
//     if (!brandId || !modelId || !color) {
//       alert('Please select Brand, Model, and Color first');
//       return;
//     }
    
//     setIsGeneratingSKU(true);
    
//     try {
//       const brands = getFieldOptions('brandId') as Brand[];
//       const models = getFieldOptions('modelId') as Model[];
      
//       const sku = generateSKU({
//         brandId,
//         modelId,
//         color,
//         brands,
//         models
//       });
      
//       if (sku) {
//         setFormData(prev => ({ ...prev, sku }));
//       }
//     } catch (error) {
//       console.error('Error generating SKU:', error);
//       alert('Failed to generate SKU');
//     } finally {
//       setIsGeneratingSKU(false);
//     }
//   };

//   const handleGenerateBarcode = async () => {
//     setIsGeneratingBarcode(true);
    
//     try {
//       const barcode = await generateBarcode();
//       if (barcode) {
//         setFormData(prev => ({ ...prev, barcode }));
//       }
//     } catch (error) {
//       console.error('Error generating barcode:', error);
//       alert('Failed to generate barcode');
//     } finally {
//       setIsGeneratingBarcode(false);
//     }
//   };

//   // Auto-generation effects
//   useEffect(() => {
//     // Auto-generate product name when brand or model changes
//     if (formData.brandId && formData.modelId) {
//       const brands = getFieldOptions('brandId') as Brand[];
//       const models = getFieldOptions('modelId') as Model[];
      
//       const productName = generateProductName({
//         brandId: formData.brandId,
//         modelId: formData.modelId,
//         color: formData.color || '',
//         brands,
//         models
//       });
      
//       if (productName && !formData.productName) {
//         setFormData(prev => ({ ...prev, productName }));
//       }
//     }
//   }, [formData.brandId, formData.modelId]);

//   useEffect(() => {
//     // Auto-generate SKU when brand, model, or color changes
//     if (formData.brandId && formData.modelId && formData.color) {
//       const brands = getFieldOptions('brandId') as Brand[];
//       const models = getFieldOptions('modelId') as Model[];
      
//       const sku = generateSKU({
//         brandId: formData.brandId,
//         modelId: formData.modelId,
//         color: formData.color,
//         brands,
//         models
//       });
      
//       if (sku && !formData.sku) {
//         setFormData(prev => ({ ...prev, sku }));
//       }
//     }
//   }, [formData.brandId, formData.modelId, formData.color]);

//   const validateField = (field: FormField, value: any): string | null => {
//     if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
//       return `${field.label} is required`;
//     }

//     if (field.validation) {
//       return field.validation(value);
//     }

//     // Built-in validations
//     if (field.type === 'email' && value) {
//       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//       if (!emailRegex.test(value)) {
//         return 'Please enter a valid email address';
//       }
//     }

//     if (field.type === 'phone' && value) {
//       const phoneRegex = /^[0-9-+\s()]+$/;
//       if (!phoneRegex.test(value)) {
//         return 'Please enter a valid phone number';
//       }
//     }

//     return null;
//   };

//   const handleInputChange = (fieldName: string, value: any) => {
//     setFormData(prev => ({
//       ...prev,
//       [fieldName]: value
//     }));

//     // Clear error when user starts typing
//     if (errors[fieldName]) {
//       setErrors(prev => ({
//         ...prev,
//         [fieldName]: ''
//       }));
//     }
//   };

//   // Dynamic specs handlers
//   const addSpec = () => {
//     const newId = Date.now().toString();
//     setDynamicSpecs(prev => [...prev, { 
//       id: newId, 
//       name: '', 
//       value: '', 
//       description: '', 
//       dataType: 'TEXT', 
//       isActive: true 
//     }]);
//   };

//   const removeSpec = (id: string) => {
//     if (dynamicSpecs.length > 1) {
//       setDynamicSpecs(prev => prev.filter(spec => spec.id !== id));
//     }
//   };

//   const updateSpec = (id: string, field: keyof DynamicSpec, value: string | boolean) => {
//     setDynamicSpecs(prev => prev.map(spec => 
//       spec.id === id ? { ...spec, [field]: value } : spec
//     ));
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
    
//     // Validate all fields
//     const newErrors: Record<string, string> = {};
//     fields.forEach(field => {
//       const error = validateField(field, formData[field.name]);
//       if (error) {
//         newErrors[field.name] = error;
//       }
//     });

//     // Validate dynamic specs if enabled
//     if (enableDynamicSpecs) {
//       dynamicSpecs.forEach((spec, index) => {
//         if (spec.name.trim() && !spec.value.trim()) {
//           newErrors[`spec_${index}_value`] = 'Spec value is required when spec name is provided';
//         }
//         if (!spec.name.trim() && spec.value.trim()) {
//           newErrors[`spec_${index}_name`] = 'Spec name is required when spec value is provided';
//         }
//       });
//     }

//     setErrors(newErrors);

//     // If no errors, submit the form
//     if (Object.keys(newErrors).length === 0) {
//       // Merge form data with dynamic specs data
//       const submissionData = { ...formData };
      
//       if (enableDynamicSpecs) {
//         dynamicSpecs.forEach((spec, index) => {
//           if (spec.name.trim() && spec.value.trim()) {
//             submissionData[`spec_${index}_name`] = spec.name;
//             submissionData[`spec_${index}_value`] = spec.value;
//             submissionData[`spec_${index}_description`] = spec.description || '';
//             submissionData[`spec_${index}_dataType`] = spec.dataType || 'TEXT';
//             submissionData[`spec_${index}_isActive`] = spec.isActive !== false;
//           }
//         });
//       }
      
//       onSubmit(submissionData);
//     }
//   };

//   const handleClear = () => {
//     const clearedData = fields.reduce((acc, field) => ({
//       ...acc,
//       [field.name]: field.type === 'checkbox' ? false : ''
//     }), {});
    
//     setFormData(clearedData);
//     setErrors({});
    
//     // Reset dynamic specs
//     if (enableDynamicSpecs) {
//       setDynamicSpecs([{ id: '1', name: '', value: '', description: '', dataType: 'TEXT', isActive: true }]);
//     }
    
//     if (onClear) {
//       onClear();
//     }
//   };

//   const togglePasswordVisibility = (fieldName: string) => {
//     setShowPasswords(prev => ({
//       ...prev,
//       [fieldName]: !prev[fieldName]
//     }));
//   };

//   // Check if field should show generate button
//   const shouldShowGenerateButton = (fieldName: string) => {
//     return ['productName', 'sku', 'barcode'].includes(fieldName);
//   };

//   // Render generate button for specific fields
//   const renderGenerateButton = (fieldName: string) => {
//     switch (fieldName) {
//       case 'productName':
//         return (
//           <button
//             type="button"
//             onClick={handleGenerateProductName}
//             className="ml-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
//           >
//             Generate
//           </button>
//         );
//       case 'sku':
//         return (
//           <button
//             type="button"
//             onClick={handleGenerateSKU}
//             disabled={isGeneratingSKU}
//             className="ml-2 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
//           >
//             {isGeneratingSKU ? 'Generating...' : 'Generate'}
//           </button>
//         );
//       case 'barcode':
//         return (
//           <button
//             type="button"
//             onClick={handleGenerateBarcode}
//             disabled={isGeneratingBarcode}
//             className="ml-2 px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
//           >
//             {isGeneratingBarcode ? 'Generating...' : 'Generate'}
//           </button>
//         );
//       default:
//         return null;
//     }
//   };

//   const renderField = (field: FormField) => {
//     const hasError = !!errors[field.name];
//     const baseInputClasses = `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
//       hasError ? 'border-red-500' : 'border-gray-300'
//     } ${field.disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`;

//     const renderInput = () => {
//       switch (field.type) {
//         case 'select':
//           return (
//             <div className="relative flex-1">
//               <select
//                 value={formData[field.name] || ''}
//                 onChange={(e) => handleInputChange(field.name, e.target.value)}
//                 className={`${baseInputClasses} appearance-none pr-10 ${
//                   !formData[field.name] ? 'text-gray-400' : 'text-gray-900'
//                 }`}
//                 disabled={field.disabled}
//               >
//                 <option value="" disabled>
//                   {field.placeholder || `Select ${field.label}`}
//                 </option>
//                 {field.options?.map((option) => (
//                   <option key={option.value} value={option.value} className="text-gray-900">
//                     {option.label}
//                   </option>
//                 ))}
//               </select>
//               <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
//                 <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//                 </svg>
//               </div>
//             </div>
//           );

//         case 'textarea':
//           return (
//             <textarea
//               value={formData[field.name] || ''}
//               onChange={(e) => handleInputChange(field.name, e.target.value)}
//               placeholder={field.placeholder}
//               rows={field.rows || 4}
//               className={baseInputClasses}
//               disabled={field.disabled}
//             />
//           );

//         case 'checkbox':
//           return (
//             <div className="flex items-center space-x-6">
//               <label className="flex items-center space-x-3 cursor-pointer">
//                 <input
//                   type="checkbox"
//                   checked={formData[field.name] === true}
//                   onChange={(e) => handleInputChange(field.name, e.target.checked)}
//                   className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
//                   disabled={field.disabled}
//                 />
//                 <span className="text-sm font-medium text-gray-700">Yes</span>
//               </label>
//               <label className="flex items-center space-x-3 cursor-pointer">
//                 <input
//                   type="checkbox"
//                   checked={formData[field.name] === false}
//                   onChange={(e) => handleInputChange(field.name, !e.target.checked)}
//                   className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
//                   disabled={field.disabled}
//                 />
//                 <span className="text-sm font-medium text-gray-700">No</span>
//               </label>
//             </div>
//           );

//         case 'radio':
//           return (
//             <div className="flex flex-wrap gap-4">
//               {field.options?.map((option) => (
//                 <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
//                   <input
//                     type="radio"
//                     name={field.name}
//                     value={option.value}
//                     checked={formData[field.name] === option.value}
//                     onChange={(e) => handleInputChange(field.name, e.target.value)}
//                     className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
//                     disabled={field.disabled}
//                   />
//                   <span className="text-sm font-medium text-gray-700">{option.label}</span>
//                 </label>
//               ))}
//             </div>
//           );

//         case 'password':
//           return (
//             <div className="relative flex-1">
//               <input
//                 type={showPasswords[field.name] ? 'text' : 'password'}
//                 value={formData[field.name] || ''}
//                 onChange={(e) => handleInputChange(field.name, e.target.value)}
//                 placeholder={field.placeholder}
//                 className={`${baseInputClasses} pr-12`}
//                 disabled={field.disabled}
//               />
//               <button
//                 type="button"
//                 onClick={() => togglePasswordVisibility(field.name)}
//                 className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 focus:outline-none"
//               >
//                 {showPasswords[field.name] ? (
//                   <EyeSlashIcon className="w-5 h-5" />
//                 ) : (
//                   <EyeIcon className="w-5 h-5" />
//                 )}
//               </button>
//             </div>
//           );

//         case 'date':
//           return (
//             <input
//               type="date"
//               value={formData[field.name] || ''}
//               onChange={(e) => handleInputChange(field.name, e.target.value)}
//               className={baseInputClasses}
//               disabled={field.disabled}
//             />
//           );

//         case 'number':
//           return (
//             <input
//               type="number"
//               value={formData[field.name] || ''}
//               onChange={(e) => handleInputChange(field.name, e.target.value)}
//               placeholder={field.placeholder}
//               className={baseInputClasses}
//               disabled={field.disabled}
//               step="any"
//             />
//           );

//         default:
//           return (
//             <input
//               type={field.type}
//               value={formData[field.name] || ''}
//               onChange={(e) => handleInputChange(field.name, e.target.value)}
//               placeholder={field.placeholder}
//               className={shouldShowGenerateButton(field.name) ? baseInputClasses.replace('w-full', 'flex-1') : baseInputClasses}
//               disabled={field.disabled}
//             />
//           );
//       }
//     };

//     return (
//       <div key={field.name} className={`${field.type === 'textarea' ? 'md:col-span-2' : ''} ${field.className || ''}`}>
//         <label className="block text-sm font-medium text-gray-700 mb-2">
//           {field.label}
//           {field.required && <span className="text-red-500 ml-1">*</span>}
//         </label>
        
//         <div className={shouldShowGenerateButton(field.name) ? "flex items-center" : ""}>
//           {renderInput()}
//           {shouldShowGenerateButton(field.name) && renderGenerateButton(field.name)}
//         </div>
        
//         {errors[field.name] && (
//           <p className="mt-2 text-sm text-red-600">{errors[field.name]}</p>
//         )}
//       </div>
//     );
//   };

//   // Filter out spec fields from the original fields array if dynamic specs are enabled
//   const filteredFields = enableDynamicSpecs 
//     ? fields.filter(field => !field.name.startsWith('spec_'))
//     : fields;

//   return (
//     <div className={`bg-white rounded-lg p-8 ${className}`}>
//       {title && (
//         <div className="mb-8">
//           <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
//         </div>
//       )}

//       <form onSubmit={handleSubmit}>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
//           {filteredFields.map((field) => renderField(field))}
//         </div>

//         {/* Dynamic Specifications Section */}
//         {enableDynamicSpecs && (
//           <div className="mb-8">
//             <div className="border-t border-gray-200 pt-8">
//               <div className="flex items-center justify-between mb-6">
//                 <div>
//                   <h3 className="text-lg font-medium text-gray-900">Product Specifications</h3>
//                   <p className="mt-1 text-sm text-gray-500">Add technical specifications for this product</p>
//                 </div>
//                 <button
//                   type="button"
//                   onClick={addSpec}
//                   className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//                 >
//                   <PlusIcon className="w-4 h-4 mr-2" />
//                   Add Spec
//                 </button>
//               </div>

//               <div className="space-y-4">
//                 {dynamicSpecs.map((spec, index) => (
//                   <div key={spec.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Spec Name
//                       </label>
//                       <input
//                         type="text"
//                         value={spec.name}
//                         onChange={(e) => updateSpec(spec.id, 'name', e.target.value)}
//                         placeholder="Enter specification name (e.g., RAM, Storage)"
//                         className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
//                       />
//                       {errors[`spec_${index}_name`] && (
//                         <p className="mt-2 text-sm text-red-600">{errors[`spec_${index}_name`]}</p>
//                       )}
//                     </div>
                    
//                     <div className="relative">
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Spec Value
//                       </label>
//                       <div className="flex">
//                         <input
//                           type="text"
//                           value={spec.value}
//                           onChange={(e) => updateSpec(spec.id, 'value', e.target.value)}
//                           placeholder="Enter specification value (e.g., 16GB, 512GB)"
//                           className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
//                         />
//                         {dynamicSpecs.length > 1 && (
//                           <button
//                             type="button"
//                             onClick={() => removeSpec(spec.id)}
//                             className="px-3 py-3 border border-l-0 border-gray-300 rounded-r-lg bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
//                             title="Remove this specification"
//                           >
//                             <TrashIcon className="w-4 h-4" />
//                           </button>
//                         )}
//                       </div>
//                       {errors[`spec_${index}_value`] && (
//                         <p className="mt-2 text-sm text-red-600">{errors[`spec_${index}_value`]}</p>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Form Actions */}
//         <div className="flex justify-end space-x-4">
//           <button
//             type="button"
//             onClick={handleClear}
//             className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors duration-200 font-medium"
//             disabled={loading}
//           >
//             {clearButtonLabel}
//           </button>
          
//           <button
//             type="submit"
//             className="px-6 py-3 bg-[#4154F1] text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
//             disabled={loading}
//           >
//             {loading && (
//               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//             )}
//             {submitButtonLabel}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default Form;