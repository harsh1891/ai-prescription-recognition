from rapidfuzz import process, fuzz

# Your drug database (keep this updated with your actual clinical list)
DRUG_DATABASE = [
    "Paracetamol", "Atorvastatin", "Metformin", "Amlodipine", 
    "Cetirizine", "Dorzolamide", "Betaloc", "Ultracet",
    "Odiment LC", "Rabeflush", "Zupiderm", "Celashil", "Dolaflush", "Pantofush"
]

def perform_fuzzy_match(query: str):
    """Searches the database for the best match using WRatio."""
    if not query or len(query.strip()) < 2:
        return None
        
    # score_cutoff=80 helps ignore irrelevant noise
    return process.extractOne(query, DRUG_DATABASE, scorer=fuzz.WRatio, score_cutoff=80)

def verify_medicine_name(extracted_name: str) -> dict:
    """
    Returns a dictionary so the frontend knows what the 
    AI saw vs what the database suggests.
    """
    # Clean the input for better matching
    clean_query = extracted_name.strip()
    
    result = perform_fuzzy_match(clean_query)
    
    # Defaults
    match_name = clean_query
    score = 0.0
    is_confident = False
    
    if result:
        match_name, score, _ = result
        # High confidence threshold (90+)
        if score >= 90.0:
            is_confident = True
        else:
            # If confidence is lower, keep the original text as the display name
            match_name = clean_query
    
    return {
        "display_name": clean_query,
        "suggested_name": match_name if is_confident else None,
        "is_confident": is_confident,
        "confidence_score": round(score, 2)
    }