import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, FileText, AlertTriangle, CheckCircle, ExternalLink, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import apiService, { PredictionResponse, PaperInfo } from '@/services/api';

interface ResearcherModeProps {
  onBack: () => void;
}

export default function ResearcherMode({ onBack }: ResearcherModeProps) {
  const [doi, setDoi] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<PredictionResponse | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<PredictionResponse[]>([]);
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  // Check backend connection on mount
  useEffect(() => {
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    try {
      await apiService.checkHealth();
      setBackendStatus('connected');
    } catch (error) {
      setBackendStatus('disconnected');
      toast.error('Backend connection failed. Please ensure the API server is running.');
    }
  };

  const handleAnalyze = async () => {
    if (!doi.trim()) {
      toast.error('Please enter a valid DOI');
      return;
    }

    setIsAnalyzing(true);
    setResults(null);

    try {
      const result = await apiService.analyzePaper(doi.trim());
      setResults(result);
      
      // Add to history
      setAnalysisHistory(prev => [result, ...prev.slice(0, 9)]); // Keep last 10
      
      toast.success('Analysis completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      toast.error(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isAnalyzing) {
      handleAnalyze();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const exportResults = () => {
    if (!results) return;
    
    const exportData = {
      doi: results.paper_info?.doi,
      title: results.paper_info?.title,
      authors: results.paper_info?.authors,
      journal: results.paper_info?.journal,
      publication_year: results.paper_info?.publication_year,
      risk_score: results.risk_score,
      risk_level: results.risk_level,
      risk_factors: results.risk_factors,
      analysis_date: new Date().toISOString(),
      model_used: results.model_used
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paperlens_analysis_${results.paper_info?.doi?.replace('/', '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Analysis exported successfully');
  };

  const loadSampleDOI = (sampleDoi: string) => {
    setDoi(sampleDoi);
  };

  const getRiskIcon = (riskScore?: number) => {
    if (!riskScore) return <AlertTriangle className="w-5 h-5" />;
    if (riskScore < 30) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (riskScore < 70) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <AlertTriangle className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Researcher Mode</h1>
              <p className="text-gray-600">Advanced paper integrity analysis and research tools</p>
            </div>
          </div>

          {/* Backend Status */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  backendStatus === 'connected' ? 'bg-green-500' : 
                  backendStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <span className="text-sm text-gray-600">
                  Backend Status: {
                    backendStatus === 'connected' ? 'Connected' :
                    backendStatus === 'disconnected' ? 'Disconnected' : 'Checking...'
                  }
                </span>
                {backendStatus === 'disconnected' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={checkBackendConnection}
                    className="ml-auto"
                  >
                    Retry Connection
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Analysis Panel */}
            <div className="lg:col-span-2 space-y-6">
              {/* DOI Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Paper Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      DOI or DOI URL
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., 10.1038/nature12345 or https://doi.org/10.1038/nature12345"
                      value={doi}
                      onChange={(e) => setDoi(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="font-mono"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleAnalyze} 
                      disabled={isAnalyzing || backendStatus !== 'connected'}
                      className="flex items-center gap-2"
                    >
                      {isAnalyzing ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                      {isAnalyzing ? 'Analyzing...' : 'Analyze Paper'}
                    </Button>
                    
                    {results && (
                      <Button variant="outline" onClick={exportResults}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    )}
                  </div>

                  {/* Sample DOIs */}
                  <div className="text-sm text-gray-600">
                    <p className="mb-2">Try these sample DOIs:</p>
                    <div className="space-y-1">
                      {apiService.getSampleDOIs().map((sample, index) => (
                        <button
                          key={index}
                          onClick={() => loadSampleDOI(sample.doi)}
                          className="block text-blue-600 hover:text-blue-800 font-mono text-xs"
                        >
                          {sample.doi} - {sample.description}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Results */}
              {results && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getRiskIcon(results.risk_score)}
                      Analysis Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Paper Information */}
                    {results.paper_info && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg">Paper Information</h3>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                          <div>
                            <span className="font-medium">Title:</span>
                            <p className="text-gray-700">{results.paper_info.title}</p>
                          </div>
                          <div>
                            <span className="font-medium">Authors:</span>
                            <p className="text-gray-700">{results.paper_info.authors}</p>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4 mt-3">
                            <div>
                              <span className="font-medium">Journal:</span>
                              <p className="text-gray-700">{results.paper_info.journal}</p>
                            </div>
                            <div>
                              <span className="font-medium">Year:</span>
                              <p className="text-gray-700">{results.paper_info.publication_year}</p>
                            </div>
                            <div>
                              <span className="font-medium">Citations:</span>
                              <p className="text-gray-700">
                                {apiService.formatCitations(results.paper_info.citations)}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium">Open Access:</span>
                              <Badge variant={results.paper_info.is_open_access ? "default" : "secondary"}>
                                {results.paper_info.is_open_access ? 'Yes' : 'No'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <span className="font-medium">DOI:</span>
                            <code className="text-sm bg-white px-2 py-1 rounded border">
                              {results.paper_info.doi}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(results.paper_info!.doi)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`https://doi.org/${results.paper_info!.doi}`, '_blank')}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Risk Assessment */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">Risk Assessment</h3>
                      <div className="bg-white border-2 rounded-lg p-6">
                        <div className="text-center mb-4">
                          <div 
                            className="text-4xl font-bold mb-2"
                            style={{ color: results.risk_color }}
                          >
                            {results.risk_score}%
                          </div>
                          <Badge 
                            className="text-white px-4 py-1"
                            style={{ backgroundColor: results.risk_color }}
                          >
                            {results.risk_level}
                          </Badge>
                        </div>
                        
                        {results.risk_factors && results.risk_factors.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">Risk Factors Identified:</h4>
                            <ul className="space-y-1">
                              {results.risk_factors.map((factor, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                  {factor}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="mt-4 text-xs text-gray-500">
                          Model used: {results.model_used === 'mock' ? 'Demo Mode' : 'ML Model'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Analysis History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Analyses</CardTitle>
                </CardHeader>
                <CardContent>
                  {analysisHistory.length === 0 ? (
                    <p className="text-gray-500 text-sm">No analyses yet</p>
                  ) : (
                    <div className="space-y-3">
                      {analysisHistory.slice(0, 5).map((analysis, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <code className="text-xs text-gray-600">
                              {analysis.paper_info?.doi}
                            </code>
                            <Badge 
                              className="text-white text-xs"
                              style={{ backgroundColor: analysis.risk_color }}
                            >
                              {analysis.risk_score}%
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {analysis.paper_info?.title}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Research Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Research Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Add your research notes here..."
                    className="min-h-[120px] resize-none"
                  />
                  <Button size="sm" className="mt-2 w-full">
                    Save Notes
                  </Button>
                </CardContent>
              </Card>

              {/* Help & Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tips & Help</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 space-y-2">
                  <p>• Use complete DOIs for best results</p>
                  <p>• Analysis considers multiple factors including citation patterns, metadata completeness, and publication details</p>
                  <p>• Export results for further analysis in your research</p>
                  <p>• Check recent analyses in the sidebar</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 