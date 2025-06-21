from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import pandas as pd
import numpy as np
import requests
import logging
from datetime import datetime
import os
import sys

# Add src directory to path to import feature extractor
sys.path.append('../src')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Try to load the model
try:
    with open('../models/paperlens_xgb_pipeline.pkl', 'rb') as f:
        pipeline = pickle.load(f)
    logger.info("Model loaded successfully")
    MODEL_AVAILABLE = True
except Exception as e:
    logger.error(f"Error loading model: {e}")
    pipeline = None
    MODEL_AVAILABLE = False

def fetch_paper_metadata_advanced(doi):
    """
    Enhanced metadata fetching using the actual feature extractor
    """
    try:
        from feature_extractor import get_work_features_from_doi
        
        # Get comprehensive features
        features = get_work_features_from_doi(doi)
        
        if not features:
            return None
            
        # Extract paper information for display
        paper_info = {
            'doi': features.get('doi', doi),
            'title': features.get('title', 'Title not available'),
            'authors': f"{features.get('author_count', 0)} authors",  # We don't get individual names from feature extractor
            'journal': features.get('journal_name', 'Journal not available'),
            'publication_year': features.get('publication_year', 'Unknown'),
            'citations': features.get('citations_in_first_2_years', 0),
            'is_open_access': features.get('is_open_access', False)
        }
        
        return paper_info, features
        
    except ImportError:
        logger.warning("Feature extractor not available, falling back to basic OpenAlex")
        return fetch_paper_metadata_basic(doi), None
    except Exception as e:
        logger.error(f"Error in advanced metadata extraction: {e}")
        return fetch_paper_metadata_basic(doi), None

def fetch_paper_metadata_basic(doi):
    """
    Basic metadata fetching (fallback)
    """
    try:
        # Clean DOI
        doi = doi.strip()
        if doi.startswith('http'):
            doi = doi.split('doi.org/')[-1] if 'doi.org/' in doi else doi
        
        # OpenAlex API URL
        url = f"https://api.openalex.org/works/doi:{doi}"
        
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if not data:
            return None
            
        # Extract paper information for display
        paper_info = {
            'doi': doi,
            'title': data.get('title', 'Title not available'),
            'authors': extract_authors(data.get('authorships', [])),
            'journal': extract_journal(data.get('primary_location')),
            'publication_year': data.get('publication_year', 'Unknown'),
            'citations': data.get('cited_by_count', 0),
            'is_open_access': data.get('open_access', {}).get('is_oa', False)
        }
        
        return paper_info
        
    except Exception as e:
        logger.error(f"Error fetching basic metadata for DOI {doi}: {e}")
        return None

def extract_authors(authorships):
    """Extract author names from authorships"""
    if not authorships:
        return 'Authors not available'
    
    authors = []
    for auth in authorships:
        if auth.get('author') and auth['author'].get('display_name'):
            authors.append(auth['author']['display_name'])
    
    if not authors:
        return 'Authors not available'
    
    if len(authors) <= 3:
        return ', '.join(authors)
    else:
        return f"{', '.join(authors[:2])}, et al."

def extract_journal(primary_location):
    """Extract journal information"""
    if not primary_location or not primary_location.get('source'):
        return 'Journal not available'
    
    source = primary_location['source']
    return source.get('display_name', 'Journal not available')

def ml_risk_analysis(features):
    """
    Use the actual ML model if available, otherwise use feature-based heuristics
    """
    if MODEL_AVAILABLE and features:
        try:
            # Convert features to DataFrame
            df = pd.DataFrame([features])
            
            # Make prediction
            prediction_proba = pipeline.predict_proba(df)
            risk_score = int(prediction_proba[0][1] * 100)
            
            # Determine risk level
            if risk_score < 30:
                risk_level = "Low Risk"
                risk_color = "#28a745"
            elif risk_score < 70:
                risk_level = "Moderate Risk"
                risk_color = "#ffc107"
            else:
                risk_level = "High Risk"
                risk_color = "#dc3545"
            
            # Extract risk factors based on features
            risk_factors = []
            if features.get('is_publisher_missing', False):
                risk_factors.append("Publisher information missing")
            if features.get('is_abstract_missing', False):
                risk_factors.append("Abstract not available")
            if features.get('title_length', 0) < 10:
                risk_factors.append("Unusually short title")
            if features.get('author_count', 0) == 1:
                risk_factors.append("Single author paper")
            if features.get('citations_in_first_2_years', 0) == 0:
                risk_factors.append("No citations in first 2 years")
            if features.get('n_references', 0) < 5:
                risk_factors.append("Low number of references")
            
            return {
                'risk_score': risk_score,
                'risk_level': risk_level,
                'risk_color': risk_color,
                'risk_factors': risk_factors,
                'model_used': 'ml'
            }
            
        except Exception as e:
            logger.error(f"Error in ML prediction: {e}")
            # Fall back to heuristic analysis
            return advanced_heuristic_analysis(features)
    
    else:
        return advanced_heuristic_analysis(features)

def advanced_heuristic_analysis(features):
    """
    Advanced heuristic analysis based on research integrity indicators
    """
    if not features:
        return mock_risk_analysis({})
    
    risk_score = 20  # Base low risk
    risk_factors = []
    
    # Publication year analysis
    pub_year = features.get('publication_year')
    if pub_year and pub_year < 2010:
        risk_score += 15
        risk_factors.append("Older publication (pre-2010)")
    
    # Author and collaboration analysis
    author_count = features.get('author_count', 0)
    if author_count == 1:
        risk_score += 20
        risk_factors.append("Single-author paper")
    elif author_count > 20:
        risk_score += 10
        risk_factors.append("Unusually large author list")
    
    # International collaboration
    if not features.get('is_international_collaboration', False):
        risk_score += 5
        risk_factors.append("No international collaboration")
    
    # Missing information
    if features.get('is_publisher_missing', False):
        risk_score += 25
        risk_factors.append("Publisher information missing")
    
    if features.get('is_abstract_missing', False):
        risk_score += 20
        risk_factors.append("Abstract not available")
    
    # Title analysis
    title_length = features.get('title_length', 0)
    if title_length < 10:
        risk_score += 15
        risk_factors.append("Unusually short title")
    elif title_length > 200:
        risk_score += 10
        risk_factors.append("Unusually long title")
    
    # Citation analysis
    citations = features.get('citations_in_first_2_years', 0)
    if citations == 0 and pub_year and (datetime.now().year - pub_year) > 2:
        risk_score += 15
        risk_factors.append("No citations after 2+ years")
    
    # Reference analysis
    n_references = features.get('n_references', 0)
    if n_references < 5:
        risk_score += 15
        risk_factors.append("Very few references")
    elif n_references > 200:
        risk_score += 5
        risk_factors.append("Unusually high number of references")
    
    # Concept analysis
    n_concepts = features.get('n_concepts', 0)
    if n_concepts == 0:
        risk_score += 10
        risk_factors.append("No subject classification")
    
    # Cap the score at 100
    risk_score = min(risk_score, 100)
    
    # Determine risk level
    if risk_score < 30:
        risk_level = "Low Risk"
        risk_color = "#28a745"
    elif risk_score < 70:
        risk_level = "Moderate Risk"
        risk_color = "#ffc107"
    else:
        risk_level = "High Risk"
        risk_color = "#dc3545"
    
    return {
        'risk_score': risk_score,
        'risk_level': risk_level,
        'risk_color': risk_color,
        'risk_factors': risk_factors,
        'model_used': 'advanced_heuristic'
    }

def mock_risk_analysis(paper_info):
    """
    Simple mock analysis (fallback for basic cases)
    """
    # Simple heuristic for demo purposes
    risk_score = 25  # Default low risk
    risk_factors = []
    
    # Check publication year
    if paper_info.get('publication_year', 2020) < 2010:
        risk_score += 20
        risk_factors.append("Relatively old publication")
    
    # Check if title is missing
    if paper_info.get('title') == 'Title not available':
        risk_score += 30
        risk_factors.append("Title information missing")
    
    # Check if authors are missing
    if paper_info.get('authors') == 'Authors not available':
        risk_score += 25
        risk_factors.append("Author information missing")
    
    # Check if journal is missing
    if paper_info.get('journal') == 'Journal not available':
        risk_score += 35
        risk_factors.append("Publisher information missing")
    
    # Check low citation count (could indicate quality issues)
    if paper_info.get('citations', 0) < 5 and paper_info.get('publication_year', 2024) < 2022:
        risk_score += 15
        risk_factors.append("Low citation count for publication age")
    
    # Cap the score at 100
    risk_score = min(risk_score, 100)
    
    # Determine risk level
    if risk_score < 30:
        risk_level = "Low Risk"
        risk_color = "#28a745"
    elif risk_score < 70:
        risk_level = "Moderate Risk"
        risk_color = "#ffc107"
    else:
        risk_level = "High Risk"
        risk_color = "#dc3545"
    
    return {
        'risk_score': risk_score,
        'risk_level': risk_level,
        'risk_color': risk_color,
        'risk_factors': risk_factors,
        'model_used': 'basic_mock'
    }

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': MODEL_AVAILABLE,
        'timestamp': datetime.now().isoformat(),
        'message': 'PaperLens Backend is running',
        'feature_extractor_available': True  # We always have this now
    })

@app.route('/predict', methods=['POST'])
def predict():
    """
    Main endpoint for retraction risk prediction using real ML features
    """
    try:
        data = request.get_json()
        
        if not data or 'doi' not in data:
            return jsonify({
                'error': 'Valid DOI is required',
                'status': 'error'
            }), 400
        
        doi = data['doi']
        logger.info(f"Prediction requested for DOI: {doi}")
        
        # Fetch paper metadata and features
        result = fetch_paper_metadata_advanced(doi)
        if isinstance(result, tuple):
            paper_info, features = result
        else:
            paper_info = result
            features = None
        
        if not paper_info:
            return jsonify({
                'error': 'Could not fetch paper metadata. Please verify the DOI is valid.',
                'status': 'error'
            }), 404
        
        # Perform risk analysis
        if features:
            risk_analysis = ml_risk_analysis(features)
        else:
            risk_analysis = mock_risk_analysis(paper_info)
        
        return jsonify({
            'status': 'success',
            'risk_score': risk_analysis['risk_score'],
            'risk_level': risk_analysis['risk_level'],
            'risk_color': risk_analysis['risk_color'],
            'risk_factors': risk_analysis['risk_factors'],
            'paper_info': paper_info,
            'model_used': risk_analysis['model_used'],
            'features_extracted': features is not None
        })
        
    except Exception as e:
        logger.error(f"Error in prediction: {e}")
        return jsonify({
            'error': 'Internal server error',
            'status': 'error'
        }), 500

@app.route('/', methods=['GET'])
def home():
    """Home endpoint"""
    return jsonify({
        'message': 'PaperLens API - Paper Integrity Analysis',
        'status': 'running',
        'endpoints': {
            'health': '/health',
            'predict': '/predict (POST)',
        },
        'model_status': 'Available' if MODEL_AVAILABLE else 'Heuristic mode',
        'feature_extraction': 'Advanced'
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("🚀 Starting PaperLens Enhanced Backend...")
    print(f"📍 Running on: http://localhost:{port}")
    print(f"🔧 Health check: http://localhost:{port}/health")
    print(f"🧠 Model status: {'Available' if MODEL_AVAILABLE else 'Heuristic mode'}")
    print("🔬 Feature extraction: Advanced")
    app.run(host='0.0.0.0', port=port, debug=True) 