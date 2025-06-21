import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, FileText, AlertTriangle, TrendingUp, Users, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import apiService, { PredictionResponse } from '@/services/api';

interface JournalistModeProps {
  onBack: () => void;
}

export default function JournalistMode({ onBack }: JournalistModeProps) {
  const [doi, setDoi] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<PredictionResponse | null>(null);
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

  const getStoryAngle = (results: PredictionResponse) => {
    const riskScore = results.risk_score || 0;
    const factors = results.risk_factors || [];
    
    if (riskScore > 70) {
      return {
        headline: "High-Risk Paper Raises Red Flags",
        angle: "investigation",
        urgency: "high",
        story_points: [
          "Multiple integrity concerns identified",
          "May warrant further investigation",
          "Could indicate broader systemic issues"
        ]
      };
    } else if (riskScore > 40) {
      return {
        headline: "Research Paper Shows Warning Signs",
        angle: "watchdog",
        urgency: "medium", 
        story_points: [
          "Some integrity indicators present",
          "Worth monitoring developments",
          "Part of broader research quality discussion"
        ]
      };
    } else {
      return {
        headline: "Paper Shows Good Integrity Indicators",
        angle: "positive",
        urgency: "low",
        story_points: [
          "Strong methodological indicators",
          "Good example of quality research",
          "Could be part of best practices story"
        ]
      };
    }
  };

  const getPublicInterest = (results: PredictionResponse) => {
    const paper = results.paper_info;
    if (!paper) return "Low";

    const citations = paper.citations || 0;
    const year = parseInt(paper.publication_year?.toString() || '2020');
    const currentYear = new Date().getFullYear();
    
    // High interest: highly cited recent papers
    if (citations > 100 && currentYear - year < 5) return "High";
    
    // Medium interest: moderately cited or recent papers
    if (citations > 20 || currentYear - year < 3) return "Medium";
    
    return "Low";
  };

  const formatForStory = () => {
    if (!results?.paper_info) return '';
    
    const paper = results.paper_info;
    const risk = results.risk_score || 0;
    
    return `Paper: "${paper.title}"
Authors: ${paper.authors}
Journal: ${paper.journal}
Year: ${paper.publication_year}
Citations: ${apiService.formatCitations(paper.citations)}
Risk Score: ${risk}% (${results.risk_level})
DOI: ${paper.doi}

Key Points:
${results.risk_factors?.map(factor => `• ${factor}`).join('\n') || '• No specific risk factors identified'}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
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
              <h1 className="text-3xl font-bold text-gray-900">Journalist Mode</h1>
              <p className="text-gray-600">Analyze research papers for story potential and public interest</p>
            </div>
          </div>

          {/* Backend Status */}
          {backendStatus !== 'connected' && (
            <Card className="mb-6 border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <div className="flex-1">
                    <p className="font-medium text-orange-800">Backend Connection Issue</p>
                    <p className="text-sm text-orange-600">
                      Cannot connect to analysis service. Please ensure the backend is running.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={checkBackendConnection}
                  >
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Analysis Panel */}
            <div className="lg:col-span-2 space-y-6">
              {/* DOI Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Paper Investigation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Enter DOI to investigate
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., 10.1038/nature12345"
                      value={doi}
                      onChange={(e) => setDoi(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="font-mono"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleAnalyze} 
                    disabled={isAnalyzing || backendStatus !== 'connected'}
                    className="w-full flex items-center gap-2"
                  >
                    {isAnalyzing ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    {isAnalyzing ? 'Investigating...' : 'Investigate Paper'}
                  </Button>

                  {/* Sample DOIs for journalists */}
                  <div className="text-sm text-gray-600">
                    <p className="mb-2 font-medium">Sample papers to investigate:</p>
                    <div className="space-y-1">
                      {apiService.getSampleDOIs().map((sample, index) => (
                        <button
                          key={index}
                          onClick={() => setDoi(sample.doi)}
                          className="block text-purple-600 hover:text-purple-800 font-mono text-xs hover:bg-purple-50 px-2 py-1 rounded"
                        >
                          {sample.doi}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Results */}
              {results && (
                <>
                  {/* Story Potential */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Story Potential Assessment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(() => {
                        const story = getStoryAngle(results);
                        const interest = getPublicInterest(results);
                        return (
                          <>
                            <div className="grid md:grid-cols-3 gap-4">
                              <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-gray-800">
                                  {results.risk_score}%
                                </div>
                                <div className="text-sm text-gray-600">Risk Score</div>
                              </div>
                              <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-lg font-bold text-gray-800">
                                  {interest}
                                </div>
                                <div className="text-sm text-gray-600">Public Interest</div>
                              </div>
                              <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <Badge 
                                  className={`text-sm ${
                                    story.urgency === 'high' ? 'bg-red-500' :
                                    story.urgency === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                >
                                  {story.urgency.toUpperCase()} PRIORITY
                                </Badge>
                                <div className="text-sm text-gray-600 mt-1">Story Urgency</div>
                              </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg">
                              <h3 className="font-bold text-lg mb-2 text-blue-800">
                                Suggested Headline
                              </h3>
                              <p className="text-blue-700 font-medium">
                                "{story.headline}"
                              </p>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-2">Story Angles:</h4>
                              <ul className="space-y-1">
                                {story.story_points.map((point, index) => (
                                  <li key={index} className="flex items-start gap-2 text-sm">
                                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                                    {point}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  {/* Paper Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Paper Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {results.paper_info && (
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-bold text-xl mb-2 text-gray-800">
                              {results.paper_info.title}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {results.paper_info.authors}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {results.paper_info.publication_year}
                              </span>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <p><span className="font-medium">Journal:</span> {results.paper_info.journal}</p>
                              <p><span className="font-medium">Citations:</span> {apiService.formatCitations(results.paper_info.citations)}</p>
                            </div>
                            <div className="space-y-2">
                              <p><span className="font-medium">Open Access:</span> 
                                <Badge variant={results.paper_info.is_open_access ? "default" : "secondary"} className="ml-2">
                                  {results.paper_info.is_open_access ? 'Yes' : 'No'}
                                </Badge>
                              </p>
                              <p className="flex items-center gap-2">
                                <span className="font-medium">View Paper:</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(`https://doi.org/${results.paper_info!.doi}`, '_blank')}
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  Open
                                </Button>
                              </p>
                            </div>
                          </div>

                          {results.risk_factors && results.risk_factors.length > 0 && (
                            <div className="bg-orange-50 p-4 rounded-lg">
                              <h4 className="font-semibold mb-2 text-orange-800">
                                Investigation Points:
                              </h4>
                              <ul className="space-y-1">
                                {results.risk_factors.map((factor, index) => (
                                  <li key={index} className="flex items-start gap-2 text-sm text-orange-700">
                                    <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                    {factor}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Story Ready Format */}
              {results && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Story-Ready Format</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <textarea
                        className="w-full h-48 p-3 text-xs font-mono bg-gray-50 border rounded resize-none"
                        value={formatForStory()}
                        readOnly
                      />
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          navigator.clipboard.writeText(formatForStory());
                          toast.success('Copied to clipboard');
                        }}
                      >
                        Copy for Story
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Journalist Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Investigation Tips</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 space-y-3">
                  <div>
                    <p className="font-medium text-gray-800 mb-1">High-Risk Papers:</p>
                    <p>Consider reaching out to authors, institutions, and journals for comment</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 mb-1">Citation Analysis:</p>
                    <p>High citations + high risk = bigger story potential</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 mb-1">Follow-up:</p>
                    <p>Check if paper has been retracted or corrected since publication</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 mb-1">Context:</p>
                    <p>Look for patterns across multiple papers from same authors/institutions</p>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Expert Contacts</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 space-y-2">
                  <p>• Research integrity experts</p>
                  <p>• Journal editors</p>
                  <p>• Institutional representatives</p>
                  <p>• Peer review specialists</p>
                  <p className="text-xs text-gray-500 mt-3">
                    Note: This tool provides analysis only. Always verify findings through proper journalistic investigation.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 