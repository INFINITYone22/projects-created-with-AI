# Main file for our Flask ATS application
# --- THIS PYTHON CODE REMAINS THE SAME AS THE PREVIOUS VERSION ---

from flask import Flask, request, jsonify, render_template
import os
import time # Added for simulating delay
import random # Added for randomizing score

# Initialize the Flask application
app = Flask(__name__)

# Configuration (can be moved to a separate config file later)
app.config['UPLOAD_FOLDER'] = 'uploads' # Folder to store uploaded resumes
app.config['ALLOWED_EXTENSIONS'] = {'txt', 'pdf', 'docx'} # Allowed resume file types

# Ensure the upload folder exists
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# --- Helper Functions ---

def allowed_file(filename):
    """Checks if the uploaded file extension is allowed."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def extract_text_from_resume(filepath):
    """
    Placeholder function to extract text from a resume file.
    We will implement actual text extraction (from PDF, DOCX) later.
    For now, it assumes a simple text file.
    """
    # Simulate some processing time for extraction
    time.sleep(0.5)
    try:
        # In a real app, use libraries like PyPDF2 for PDF, python-docx for DOCX
        if filepath.lower().endswith('.txt'):
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f: # Added errors='ignore'
                return f.read()
        elif filepath.lower().endswith('.pdf'):
            # Add PDF extraction logic here (e.g., using PyPDF2 or pdfminer.six)
            print(f"PDF extraction not yet implemented for {filepath}")
            return "Sample PDF text extracted. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam." # Placeholder
        elif filepath.lower().endswith('.docx'):
            # Add DOCX extraction logic here (e.g., using python-docx)
            print(f"DOCX extraction not yet implemented for {filepath}")
            return "Sample DOCX text extracted. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Quis nostrud exercitation ullamco laboris nisi ut aliquip." # Placeholder
        else:
            # Handle case where file extension might be allowed but not handled
            print(f"Text extraction not configured for this file type: {filepath}")
            return ""
    except Exception as e:
        print(f"Error extracting text from {filepath}: {e}")
        return "" # Return empty string on error

def analyze_resume_ai(resume_text, job_description_text):
    """
    Placeholder for the core AI analysis function.
    This is where we'll use sentence transformers or LLMs
    to compare the resume against the job description.
    """
    print("AI Analysis Triggered (Placeholder)")
    # Simulate analysis time more realistically
    time.sleep(1.5) # Reduced delay slightly

    # More detailed placeholder response
    analysis_result = {
        'similarity_score': 0.72, # Placeholder
        'matched_keywords': ['python', 'flask', 'api design', 'sql', 'problem solving', 'git', 'docker', 'agile'], # Placeholder
        'semantic_summary': 'Candidate profile shows strong alignment with backend development requirements, particularly in Python and API creation. SQL skills are mentioned, and familiarity with Git is noted. Communication seems clear. Further discussion on project specifics and Docker/Agile experience recommended.', # Placeholder AI insight
        'warnings': ['Limited explicit mention of cloud platforms (AWS/Azure/GCP).', 'Frontend technology experience is not detailed.'], # Placeholder warnings
        'candidate_strengths': ['Python (Flask)', 'API Development', 'SQL Database Interaction', 'Version Control (Git)', 'Problem Solving Approach'], # Placeholder
        'potential_gaps': ['Cloud Deployment Experience', 'Frontend Frameworks (React/Vue/Angular)', 'NoSQL Database Knowledge', 'Specific Agile Methodology Depth'] # Placeholder
    }
    # Randomize score slightly for demo
    analysis_result['similarity_score'] = round(random.uniform(0.50, 0.95), 2)

    return analysis_result

# --- Routes ---

@app.route('/')
def index():
    """Renders the main page."""
    # Renders the updated index.html
    return render_template('index.html', message="AI Resume Analyzer")

@app.route('/upload', methods=['POST'])
def upload_resume():
    """Handles resume file uploads and triggers analysis."""
    # Basic input validation
    if 'resume' not in request.files:
        return jsonify({"error": "No resume file part found in the request."}), 400
    file = request.files['resume']
    job_description = request.form.get('job_description', '').strip() # Get and strip whitespace

    if file.filename == '':
        return jsonify({"error": "No resume file selected."}), 400
    if not job_description:
        return jsonify({"error": "Job description cannot be empty."}), 400


    if file and allowed_file(file.filename):
        # NOTE: Using secure_filename is recommended in production
        from werkzeug.utils import secure_filename
        # Use secure_filename to prevent directory traversal issues
        original_filename = file.filename
        safe_filename = secure_filename(original_filename)
        # Consider adding a unique prefix/suffix (e.g., timestamp) to prevent overwrites
        # filename = f"{int(time.time())}_{safe_filename}"
        filename = safe_filename # Keep it simple for now
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

        try:
            file.save(filepath)

            # 1. Extract text from the saved resume file
            print(f"Attempting to extract text from: {filepath}")
            resume_text = extract_text_from_resume(filepath)
            if not resume_text:
                 print(f"Failed to extract text from {filename}.")
                 # Clean up failed upload
                 if os.path.exists(filepath): os.remove(filepath)
                 # Provide a more specific error message if possible
                 return jsonify({"error": f"Could not extract text from the uploaded file '{original_filename}'. It might be empty, corrupted, or an unsupported format variant."}), 500

            print(f"Successfully extracted text from {filename}.")

            # 2. Perform AI Analysis (using the placeholder function for now)
            print("Starting AI analysis...")
            analysis = analyze_resume_ai(resume_text, job_description)
            print("AI analysis complete.")

            # 3. (Future) Store results in the database

            # 4. Return analysis results
            return jsonify({
                "message": "Analysis successful.",
                "filename": original_filename, # Return the original filename to the user
                "analysis": analysis
                }), 200

        except Exception as e:
            print(f"An unexpected error occurred during upload/analysis for {original_filename}: {e}")
            # Clean up uploaded file if error occurs during processing
            if os.path.exists(filepath):
                try:
                    os.remove(filepath)
                    print(f"Cleaned up file: {filepath}")
                except OSError as rm_error:
                    print(f"Error removing file {filepath}: {rm_error}")
            # Return a generic server error message to the user
            return jsonify({"error": f"An internal server error occurred. Please try again later."}), 500
        finally:
            # Optional: Decide whether to keep uploaded files after processing
            pass

    else:
        # Handle disallowed file types
        return jsonify({"error": f"File type not allowed. Please upload one of: {', '.join(app.config['ALLOWED_EXTENSIONS'])}"}), 400

# --- Running the App ---
if __name__ == '__main__':
    # Debug mode is helpful during development
    # Use a proper WSGI server like Gunicorn for production
    app.run(debug=True, host='0.0.0.0', port=5000) # Accessible on network if needed
