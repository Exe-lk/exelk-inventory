import { Brand, Category, Model, Supplier } from '@/lib/services/productService';

export interface GenerationInputs {
  brandId: string;
  modelId: string;
  color: string;
  brands: Brand[];
  models: Model[];
}

// Function to generate Product Name
export function generateProductName(inputs: GenerationInputs): string {
  const { brandId, modelId, brands, models } = inputs;
  
  if (!brandId || !modelId) return '';
  
  const brand = brands.find(b => b.BrandID.toString() === brandId);
  const model = models.find(m => m.ModelID.toString() === modelId);
  
  if (!brand || !model) return '';
  
  return `${brand.BrandName} ${model.ModelName}`;
}

// Function to summarize product name for SKU
function summarizeProductName(productName: string, brandName: string): string {
  // Remove brand name from product name and get the model part
  const modelPart = productName.replace(brandName, '').trim();
  
  // Split into words and take first letter of each significant word
  const words = modelPart.split(' ').filter(word => word.length > 0);
  
  let summary = '';
  words.forEach(word => {
    // Skip common words
    if (!['the', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'with'].includes(word.toLowerCase())) {
      // Take first letter and first consonant/vowel after first letter if exists
      summary += word.charAt(0).toUpperCase();
      if (word.length > 1) {
        for (let i = 1; i < Math.min(3, word.length); i++) {
          const char = word.charAt(i);
          if (/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/.test(char)) {
            summary += char.toUpperCase();
            break;
          }
        }
      }
    }
  });
  
  // Ensure minimum 3 characters, maximum 6
  if (summary.length < 3) {
    // If too short, take more characters from the model name
    const cleanModel = modelPart.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    summary = cleanModel.substring(0, 6);
  } else if (summary.length > 6) {
    summary = summary.substring(0, 6);
  }
  
  return summary;
}

// Function to get current year-month code
function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month with leading zero
  return year + month;
}

// Function to generate SKU
export function generateSKU(inputs: GenerationInputs): string {
  const { brandId, modelId, color, brands, models } = inputs;
  
  if (!brandId || !modelId || !color) return '';
  
  const brand = brands.find(b => b.BrandID.toString() === brandId);
  const model = models.find(m => m.ModelID.toString() === modelId);
  
  if (!brand || !model) return '';
  
  // First section: First letter of brand
  const brandLetter = brand.BrandName.charAt(0).toUpperCase();
  
  // Second section: Summarized product name
  const productName = `${brand.BrandName} ${model.ModelName}`;
  const modelSummary = summarizeProductName(productName, brand.BrandName);
  
  // Third section: Year-Month code
  const yearMonth = getCurrentYearMonth();
  
  // Fourth section: Color (clean and limit to 8 characters)
  const cleanColor = color.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 8);
  
  return `${brandLetter}-${modelSummary}-${yearMonth}-${cleanColor}`;
}

// Function to generate Barcode
export async function generateBarcode(): Promise<string> {
  try {
    const yearMonth = getCurrentYearMonth();
    
    // Get the next sequential number by checking existing barcodes
    const response = await fetch(`/api/barcode/next?yearMonth=${yearMonth}`, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.barcode;
    } else {
      // Fallback: generate with timestamp-based number
      const timestamp = Date.now();
      const lastSixDigits = timestamp.toString().slice(-6);
      return `${yearMonth}${lastSixDigits}`;
    }
  } catch (error) {
    console.error('Error generating barcode:', error);
    // Fallback: generate with timestamp-based number
    const timestamp = Date.now();
    const lastSixDigits = timestamp.toString().slice(-6);
    return `${getCurrentYearMonth()}${lastSixDigits}`;
  }
}