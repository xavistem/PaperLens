// API service for PaperLens backend communication

export interface PaperInfo {
  doi: string;
  title: string;
  authors: string;
  journal: string;
  publication_year: number | string;
  citations: number;
  is_open_access: boolean;
}

export interface RiskAnalysis {
  risk_score: number;
  risk_level: string;
  risk_color: string;
  risk_factors: string[];
}

export interface PredictionResponse {
  status: 'success' | 'error';
  risk_score?: number;
  risk_level?: string;
  risk_color?: string;
  risk_factors?: string[];
  paper_info?: PaperInfo;
  model_used?: string;
  error?: string;
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  timestamp: string;
  message: string;
}

const API_BASE_URL = 'http://localhost:5000';

class ApiService {
  /**
   * Check backend health
   */
  async checkHealth(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw new Error('Backend is not available');
    }
  }

  /**
   * Analyze paper by DOI
   */
  async analyzePaper(doi: string): Promise<PredictionResponse> {
    try {
      // Validate DOI format
      if (!this.isValidDOI(doi)) {
        throw new Error('Invalid DOI format');
      }

      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ doi }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      return data;
    } catch (error) {
      console.error('Paper analysis failed:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unexpected error during analysis');
    }
  }

  /**
   * Validate DOI format
   */
  private isValidDOI(doi: string): boolean {
    // Basic DOI validation
    const doiPattern = /^10\.\d{4,}\/\S+$/;
    
    // Clean DOI if it's a URL
    const cleanDoi = doi.includes('doi.org/') 
      ? doi.split('doi.org/')[1] 
      : doi.trim();
    
    return doiPattern.test(cleanDoi);
  }

  /**
   * Clean DOI from URL format
   */
  cleanDOI(doi: string): string {
    if (doi.includes('doi.org/')) {
      return doi.split('doi.org/')[1];
    }
    return doi.trim();
  }

  /**
   * Get formatted risk level with color
   */
  getRiskLevelInfo(riskScore: number): { level: string; color: string; description: string } {
    if (riskScore < 30) {
      return {
        level: 'Low Risk',
        color: '#28a745',
        description: 'This paper shows low indicators of potential retraction risk.'
      };
    } else if (riskScore < 70) {
      return {
        level: 'Moderate Risk', 
        color: '#ffc107',
        description: 'This paper shows some indicators that warrant closer examination.'
      };
    } else {
      return {
        level: 'High Risk',
        color: '#dc3545', 
        description: 'This paper shows multiple indicators of potential retraction risk.'
      };
    }
  }

  /**
   * Format citations count
   */
  formatCitations(count: number): string {
    if (count === 0) return 'No citations';
    if (count === 1) return '1 citation';
    if (count < 1000) return `${count} citations`;
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k citations`;
    return `${(count / 1000000).toFixed(1)}M citations`;
  }

  /**
   * Get sample DOIs for testing
   */
  getSampleDOIs(): { doi: string; description: string }[] {
    return [
      {
        doi: '10.1038/nature12345',
        description: 'Nature article (sample)'
      },
      {
        doi: '10.1126/science.abc123',
        description: 'Science article (sample)'
      },
      {
        doi: '10.1016/j.cell.2023.01.001',
        description: 'Cell article (sample)'
      }
    ];
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService; 