# src/feature_extractor.py

import requests
import time
import re
from typing import Dict, Any, List, Optional

MY_EMAIL = "xavi@gmail.com"
BASE_URL = "https://api.openalex.org"
HEADERS = { 'User-Agent': f'RetractionWatchProject/5.0 (mailto:{MY_EMAIL})' }

def reconstruct_abstract(inverted_index: Optional[Dict[str, List[int]]]) -> str:
    if not inverted_index: return ""
    try:
        word_map = {index: word for word, indices in inverted_index.items() for index in indices}
        return " ".join(word_map[i] for i in sorted(word_map.keys()))
    except Exception: return ""

def get_unique_institution_ids(authorships: List[Dict[str, Any]]) -> set:
    institution_ids = set()
    for authorship in authorships or []:
        for institution in authorship.get('institutions', []):
            if institution and institution.get('id'):
                institution_ids.add(institution['id'])
    return institution_ids

def calculate_citations_in_first_n_years(counts_by_year: List[Dict], pub_year: int, n: int = 2) -> Optional[int]:
    """Calculates the sum of citations within the first N years of publication."""
    if not counts_by_year or not pub_year:
        return 0
    
    total_citations = 0
    for entry in counts_by_year:
        year = entry.get('year')
        if year and pub_year <= year < pub_year + n:
            total_citations += entry.get('cited_by_count', 0)
    return total_citations

def get_work_features_from_doi(doi: str) -> Optional[Dict[str, Any]]:
    if not isinstance(doi, str) or not doi: return None
    if doi.startswith('http'): doi = doi.replace("https://doi.org/", "")

    url = f"{BASE_URL}/works/doi:{doi}"
    
    try:
        response = requests.get(url, headers=HEADERS, timeout=45)
        if response.status_code == 404: return None
        response.raise_for_status()
        work = response.json()
        
        # Extraction Logic
        journal_name, publisher, source_id = None, None, None
        primary_location = work.get('primary_location', {}) or {}
        source = primary_location.get('source', {}) or {}
        if source:
            journal_name = source.get('display_name')
            publisher = source.get('host_organization_name')
            source_id = source.get('id')
        
        pub_year = work.get('publication_year')
        authorships = work.get('authorships', []) or []
        title = work.get('title', '')
        
        raw_abstract = reconstruct_abstract(work.get('abstract_inverted_index'))
        clean_abstract = "" if bool(re.search(r'\b(retracted|retraction|withdrawn)\b', raw_abstract, re.IGNORECASE)) else raw_abstract
        
        unique_countries = {c for auth in authorships if auth for c in auth.get('countries', []) if c}
        first_author_country = None
        if authorships and isinstance(authorships[0], dict) and authorships[0].get('countries'):
            first_author_country = authorships[0]['countries'][0]
        
        concepts = work.get('concepts', []) or []
        top_concept_level = concepts[0].get('level') if concepts and isinstance(concepts[0], dict) else None

        # CRITICAL ADJUSTMENT: Time-windowed citations
        citations_in_first_2_years = calculate_citations_in_first_n_years(work.get('counts_by_year'), pub_year, n=2)

        features = {
            'doi': work.get('doi', '').replace("https://doi.org/", ""), 'source_id': source_id,
            'publication_year': pub_year, 'article_type': work.get('type'),
            'is_open_access': (work.get('open_access') or {}).get('is_oa', False),
            'author_count': len(authorships), 'institution_count': len(get_unique_institution_ids(authorships)),
            'country_count': len(unique_countries), 'first_author_country': first_author_country,
            'is_international_collaboration': len(unique_countries) > 1,
            'journal_name': journal_name, 'publisher': publisher,
            'is_publisher_missing': publisher is None, 
            'title': title, 'abstract': clean_abstract, 
            'title_length': len(title) if title else 0, 'abstract_length': len(clean_abstract),
            'is_abstract_missing': not clean_abstract, 
            'n_concepts': len(concepts), 'top_concept_level': top_concept_level,
            'citations_in_first_2_years': citations_in_first_2_years, 
            'n_references': work.get('referenced_works_count', 0),
        }
        return features
    except Exception:
        return None