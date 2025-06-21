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

# Add src directory to path
sys.path.append('../src')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global variables
pipeline = None
MODEL_AVAILABLE = False

def load_model():
    """Try to load the ML model"""
    global pipeline, MODEL_AVAILABLE
    try:
        with open('../models/paperlens_xgb_pipeline.pkl', 'rb') as f:
            pipeline = pickle.load(f)
        MODEL_AVAILABLE = True
        logger.info("✅ Model loaded successfully!")
        return True
    except Exception as e:
        logger.error(f"❌ Error loading model: {e}")
        MODEL_AVAILABLE = False
        return False

def get_paper_data_from_openalex(doi):
    """Get comprehensive paper data from OpenAlex"""
    try:
        # Clean DOI
        if doi.startswith('http'):
            doi = doi.split('doi.org/')[-1]
        
        url = f"https://api.openalex.org/works/doi:{doi}"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        return response.json()
    except Exception as e:
        logger.error(f"Error fetching from OpenAlex: {e}")
        return None

def extract_features_for_model(openalex_data):
    """Extract ALL possible features that the model might expect"""
    if not openalex_data:
        return None
    
    try:
        # Create comprehensive feature dictionary
        features = {}
        
        # Basic info
        features['publication_year'] = openalex_data.get('publication_year', 2020)
        features['is_open_access'] = openalex_data.get('open_access', {}).get('is_oa', False)
        
        # Authorship features
        authorships = openalex_data.get('authorships', [])
        features['author_count'] = len(authorships) if authorships else 0
        
        # Institution features
        institution_ids = set()
        countries = set()
        for auth in authorships:
            for inst in auth.get('institutions', []):
                if inst.get('id'):
                    institution_ids.add(inst['id'])
                if inst.get('country_code'):
                    countries.add(inst['country_code'])
        
        features['institution_count'] = len(institution_ids)
        features['country_count'] = len(countries)
        features['is_international_collaboration'] = len(countries) > 1
        
        # Get first author country
        first_author_country = None
        if authorships and authorships[0].get('institutions'):
            first_inst = authorships[0]['institutions'][0]
            first_author_country = first_inst.get('country_code', 'Unknown')
        features['first_author_country'] = first_author_country or 'Unknown'
        
        # Content features
        title = openalex_data.get('title', '')
        features['title'] = title
        features['title_length'] = len(title) if title else 0
        features['is_title_missing'] = not bool(title)
        
        # Abstract features
        abstract_dict = openalex_data.get('abstract_inverted_index', {})
        abstract_length = 0
        if abstract_dict:
            # Reconstruct abstract length
            max_index = 0
            for word, indices in abstract_dict.items():
                if indices:
                    max_index = max(max_index, max(indices))
            abstract_length = max_index
        
        features['abstract_length'] = abstract_length
        features['is_abstract_missing'] = abstract_length == 0
        
        # Journal/Publisher features
        primary_location = openalex_data.get('primary_location', {})
        source = primary_location.get('source', {}) if primary_location else {}
        
        journal_name = source.get('display_name') if source else None
        publisher = source.get('host_organization_name') if source else None
        
        features['journal_name'] = journal_name
        features['publisher'] = publisher
        features['is_publisher_missing'] = not bool(publisher)
        
        # Citation features
        features['citations_in_first_2_years'] = openalex_data.get('cited_by_count', 0)
        
        # Reference count
        features['n_references'] = openalex_data.get('referenced_works_count', 0)
        
        # Concepts features
        concepts = openalex_data.get('concepts', [])
        features['n_concepts'] = len(concepts)
        features['top_concept_level'] = concepts[0].get('level', 0) if concepts else 0
        
        # Article type features
        article_type = openalex_data.get('type', 'journal-article')
        features['article_type'] = article_type
        features['is_journal_article'] = article_type == 'journal-article'
        features['is_conference_paper'] = article_type == 'conference-paper'
        features['is_book_chapter'] = article_type == 'book-chapter'
        features['is_dissertation'] = article_type == 'dissertation'
        features['is_other'] = article_type not in ['journal-article', 'conference-paper', 'book-chapter', 'dissertation']
        
        # Missing data indicators
        features['is_doi_missing'] = False  # We have DOI if we got here
        features['is_publication_year_missing'] = not bool(openalex_data.get('publication_year'))
        features['is_author_count_missing'] = len(authorships) == 0
        
        return features
        
    except Exception as e:
        logger.error(f"Error extracting features: {e}")
        return None

def predict_with_model(features):
    """Use the loaded model to predict"""
    if not MODEL_AVAILABLE or not features:
        return None
    
    try:
        # Convert to DataFrame
        df = pd.DataFrame([features])
        
        # The model should handle everything automatically
        prediction_proba = pipeline.predict_proba(df)
        prediction = pipeline.predict(df)
        
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
        
        return {
            'risk_score': risk_score,
            'risk_level': risk_level,
            'risk_color': risk_color,
            'prediction_proba': prediction_proba[0].tolist(),
            'model_used': 'ml_pipeline'
        }
        
    except Exception as e:
        logger.error(f"Error in model prediction: {e}")
        return None

def fallback_analysis(openalex_data):
    """Fallback analysis if model fails"""
    risk_score = 30
    risk_factors = []
    
    # Simple heuristics
    pub_year = openalex_data.get('publication_year', 2020)
    if pub_year < 2010:
        risk_score += 20
        risk_factors.append("Older publication")
    
    if not openalex_data.get('title'):
        risk_score += 30
        risk_factors.append("Missing title")
    
    authorships = openalex_data.get('authorships', [])
    if len(authorships) == 0:
        risk_score += 25
        risk_factors.append("No author information")
    elif len(authorships) == 1:
        risk_score += 15
        risk_factors.append("Single author")
    
    citations = openalex_data.get('cited_by_count', 0)
    if citations == 0 and (datetime.now().year - pub_year) > 2:
        risk_score += 15
        risk_factors.append("No citations after 2+ years")
    
    risk_score = min(risk_score, 100)
    
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
        'model_used': 'fallback_heuristic'
    }

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'model_loaded': MODEL_AVAILABLE,
        'timestamp': datetime.now().isoformat(),
        'message': 'PaperLens Backend - Model Integration'
    })

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        
        if not data or 'doi' not in data:
            return jsonify({
                'error': 'Valid DOI is required',
                'status': 'error'
            }), 400
        
        doi = data['doi']
        logger.info(f"Prediction requested for DOI: {doi}")
        
        # Get paper data from OpenAlex
        openalex_data = get_paper_data_from_openalex(doi)
        
        if not openalex_data:
            return jsonify({
                'error': 'Could not fetch paper data. Please verify the DOI.',
                'status': 'error'
            }), 404
        
        # Extract paper info for display
        paper_info = {
            'doi': doi,
            'title': openalex_data.get('title', 'Title not available'),
            'authors': f"{len(openalex_data.get('authorships', []))} authors",
            'journal': openalex_data.get('primary_location', {}).get('source', {}).get('display_name', 'Journal not available'),
            'publication_year': openalex_data.get('publication_year', 'Unknown'),
            'citations': openalex_data.get('cited_by_count', 0),
            'is_open_access': openalex_data.get('open_access', {}).get('is_oa', False)
        }
        
        # Try ML model first
        if MODEL_AVAILABLE:
            features = extract_features_for_model(openalex_data)
            ml_result = predict_with_model(features)
            
            if ml_result:
                return jsonify({
                    'status': 'success',
                    'risk_score': ml_result['risk_score'],
                    'risk_level': ml_result['risk_level'],
                    'risk_color': ml_result['risk_color'],
                    'risk_factors': ['ML model prediction'],
                    'paper_info': paper_info,
                    'model_used': ml_result['model_used'],
                    'prediction_proba': ml_result['prediction_proba']
                })
        
        # Fallback to heuristic analysis
        result = fallback_analysis(openalex_data)
        
        return jsonify({
            'status': 'success',
            'risk_score': result['risk_score'],
            'risk_level': result['risk_level'],
            'risk_color': result['risk_color'],
            'risk_factors': result.get('risk_factors', []),
            'paper_info': paper_info,
            'model_used': result['model_used']
        })
        
    except Exception as e:
        logger.error(f"Error in prediction: {e}")
        return jsonify({
            'error': 'Internal server error',
            'status': 'error'
        }), 500

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'message': 'PaperLens API - Model Integration Ready',
        'status': 'running',
        'model_status': 'Available' if MODEL_AVAILABLE else 'Fallback mode'
    })

if __name__ == '__main__':
    print("🚀 Starting PaperLens - Model Integration Backend...")
    print("🔄 Loading ML model...")
    
    load_model()
    
    port = int(os.environ.get('PORT', 5000))
    print(f"📍 Running on: http://localhost:{port}")
    print(f"🧠 Model status: {'✅ Available' if MODEL_AVAILABLE else '⚠️ Fallback mode'}")
    app.run(host='0.0.0.0', port=port, debug=True) 