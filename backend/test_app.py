from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import logging
from datetime import datetime
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

def fetch_paper_metadata(doi):
    """
    Fetch paper metadata using OpenAlex API
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
        logger.error(f"Error fetching metadata for DOI {doi}: {e}")
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

def enhanced_risk_analysis(paper_info):
    """
    Enhanced risk analysis using research-based heuristics
    """
    risk_score = 25  # Base score
    risk_factors = []
    
    # Publication year analysis
    pub_year = paper_info.get('publication_year', 2020)
    if isinstance(pub_year, int):
        if pub_year < 2000:
            risk_score += 30
            risk_factors.append("Very old publication (pre-2000)")
        elif pub_year < 2010:
            risk_score += 15
            risk_factors.append("Older publication (pre-2010)")
    
    # Title analysis
    title = paper_info.get('title', '')
    if title == 'Title not available':
        risk_score += 35
        risk_factors.append("Title information missing")
    elif len(title) < 10:
        risk_score += 20
        risk_factors.append("Unusually short title")
    elif len(title) > 200:
        risk_score += 10
        risk_factors.append("Unusually long title")
    
    # Author analysis
    authors = paper_info.get('authors', '')
    if authors == 'Authors not available':
        risk_score += 30
        risk_factors.append("Author information missing")
    elif 'et al.' not in authors and ',' not in authors:
        risk_score += 15
        risk_factors.append("Single-author paper")
    
    # Journal analysis
    journal = paper_info.get('journal', '')
    if journal == 'Journal not available':
        risk_score += 40
        risk_factors.append("Publisher information missing")
    
    # Citation analysis
    citations = paper_info.get('citations', 0)
    current_year = datetime.now().year
    if isinstance(pub_year, int) and (current_year - pub_year) > 2:
        if citations == 0:
            risk_score += 20
            risk_factors.append("No citations after 2+ years")
        elif citations < 3:
            risk_score += 10
            risk_factors.append("Very few citations for age")
    
    # Open access analysis
    if not paper_info.get('is_open_access', False):
        risk_score += 5
        risk_factors.append("Not open access")
    
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
        'risk_factors': risk_factors
    }

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': False,  # We'll fix the model later
        'timestamp': datetime.now().isoformat(),
        'message': 'PaperLens Backend is running - Enhanced Mode'
    })

@app.route('/predict', methods=['POST'])
def predict():
    """
    Main endpoint for retraction risk prediction
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
        
        # Fetch paper metadata
        paper_info = fetch_paper_metadata(doi)
        
        if not paper_info:
            return jsonify({
                'error': 'Could not fetch paper metadata. Please verify the DOI is valid.',
                'status': 'error'
            }), 404
        
        # Perform enhanced risk analysis
        risk_analysis = enhanced_risk_analysis(paper_info)
        
        return jsonify({
            'status': 'success',
            'risk_score': risk_analysis['risk_score'],
            'risk_level': risk_analysis['risk_level'],
            'risk_color': risk_analysis['risk_color'],
            'risk_factors': risk_analysis['risk_factors'],
            'paper_info': paper_info,
            'model_used': 'enhanced_heuristic'
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
        'message': 'PaperLens API - Enhanced Backend',
        'status': 'running',
        'endpoints': {
            'health': '/health',
            'predict': '/predict (POST)',
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("🚀 Starting PaperLens Enhanced Backend (Working Version)...")
    print(f"📍 Running on: http://localhost:{port}")
    print(f"🔧 Health check: http://localhost:{port}/health")
    print("🎯 Status: Backend connection will work!")
    app.run(host='0.0.0.0', port=port, debug=True) 