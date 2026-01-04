from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
import datetime
import jwt

public_bp = Blueprint('public', __name__)

def get_db():
    from app import mongo
    return mongo.db

def get_user_id_from_token():
    """
    Récupère l'ID depuis le token JWT.
    Compatible avec votre token qui utilise 'user_id'.
    """
    auth_header = request.headers.get('Authorization')
    
    # DEBUG: Voir si le token arrive bien au serveur
    if not auth_header:
        print("DEBUG: Aucun header Authorization reçu.")
        return None, None
    
    try:
        parts = auth_header.split(" ")
        if len(parts) != 2 or parts[0].lower() != 'bearer':
             print(f"DEBUG: Header malformé: {auth_header}")
             return None, None
             
        token = parts[1]
        
        # Décodage
        payload = jwt.decode(
            token, 
            current_app.config['SECRET_KEY'], 
            algorithms=["HS256"]
        )
        
        # Votre token utilise 'user_id', on le récupère ici
        user_id = payload.get('user_id')
        
        print(f"DEBUG: Token décodé avec succès. User ID: {user_id}")
        return user_id, None

    except jwt.ExpiredSignatureError:
        print("DEBUG: Token expiré")
        return None, (jsonify({"error": "Session expired"}), 401)
    except jwt.InvalidTokenError as e:
        print(f"DEBUG: Token invalide: {str(e)}")
        return None, (jsonify({"error": "Invalid token"}), 401)


@public_bp.route('/surveys/<survey_id>', methods=['GET'])
def get_public_survey(survey_id):
    # Auth OPTIONNELLE pour voir le sondage
    user_id, error_resp = get_user_id_from_token()
    # On ignore error_resp ici car on veut laisser les anonymes voir la page

    if not ObjectId.is_valid(survey_id):
        return jsonify({"error": "Invalid Survey ID"}), 400
    
    db = get_db()
    survey = db.surveys.find_one({'_id': ObjectId(survey_id)})
    
    if not survey:
        return jsonify({"error": "Survey not found"}), 404
    
    # Logique pour vérifier si l'utilisateur a déjà répondu
    has_responded = False
    if user_id:
         existing_response = db.responses.find_one({
             'survey_id': ObjectId(survey_id),
             'user_id': str(user_id) 
         })
         if existing_response:
             has_responded = True
    
    public_data = {
        "_id": str(survey['_id']),
        "title": survey.get('title'),
        "description": survey.get('description'),
        "questions": survey.get('questions', []),
        "created_by": str(survey.get('created_by')),
        "has_responded": has_responded
    }
    return jsonify(public_data), 200


@public_bp.route('/surveys/<survey_id>/respond', methods=['POST'])
def submit_response(survey_id):
    # Auth OBLIGATOIRE pour répondre
    user_id, error_resp = get_user_id_from_token()
    
    if error_resp: return error_resp
    if not user_id:
        return jsonify({"error": "Authentication required"}), 401

    if not ObjectId.is_valid(survey_id):
        return jsonify({"error": "Invalid ID"}), 400
        
    data = request.json
    answers = data.get('answers')

    db = get_db()
    survey = db.surveys.find_one({'_id': ObjectId(survey_id)})
    
    if not survey:
        return jsonify({"error": "Survey not found"}), 404

    # Bloquer le créateur
    if str(user_id) == str(survey.get('created_by')):
        return jsonify({"error": "You cannot submit a response to your own survey."}), 403

    # Bloquer les doublons
    existing_response = db.responses.find_one({
        'survey_id': ObjectId(survey_id),
        'user_id': str(user_id)
    })
    if existing_response:
        return jsonify({"error": "You have already responded to this survey"}), 409

    response_doc = {
        'survey_id': ObjectId(survey_id),
        'user_id': str(user_id),
        'answers': answers,
        'submitted_at': datetime.datetime.utcnow()
    }

    db.responses.insert_one(response_doc)
    db.surveys.update_one({'_id': ObjectId(survey_id)}, {'$inc': {'response_count': 1}})

    return jsonify({"message": "Response recorded successfully"}), 201