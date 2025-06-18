import json
import re
from typing import List, Dict, Any
import PyPDF2

def extract_questions_from_pdf(pdf_path: str) -> List[Dict[str, Any]]:
    questions = []
    current_question = None
    current_options = []
    
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        
        # Extract text from each page
        for page in reader.pages:
            text = page.extract_text()
            lines = text.split('\n')
            
            for line in lines:
                # Check for question number pattern (e.g., "1. ")
                question_match = re.match(r'^(\d+)\.\s+(.+)$', line)
                if question_match:
                    # Save previous question if exists
                    if current_question:
                        current_question['options'] = current_options
                        questions.append(current_question)
                    
                    # Start new question
                    question_number = int(question_match.group(1))
                    question_text = question_match.group(2)
                    
                    # Determine domain based on question number
                    domain_number = (question_number - 1) // 18 + 1
                    domain_name = get_domain_name(domain_number)
                    domain_weight = get_domain_weight(domain_number)
                    
                    current_question = {
                        'id': question_number,
                        'domain': {
                            'number': domain_number,
                            'name': domain_name,
                            'weight': domain_weight
                        },
                        'questionText': question_text,
                        'options': [],
                        'correctAnswer': '',  # Will be filled from answers section
                        'explanation': '',    # Will be filled from answers section
                        'questionType': 'multiple-choice'
                    }
                    current_options = []
                
                # Check for option pattern (e.g., "A. ")
                option_match = re.match(r'^([A-D])\.\s+(.+)$', line)
                if option_match and current_question:
                    current_options.append({
                        'letter': option_match.group(1),
                        'text': option_match.group(2)
                    })
        
        # Add the last question
        if current_question:
            current_question['options'] = current_options
            questions.append(current_question)
    
    return questions

def extract_answers_from_pdf(pdf_path: str) -> Dict[int, Dict[str, str]]:
    answers = {}
    current_question = None
    
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        
        # Start from page 217 (Appendix)
        for page in reader.pages[216:]:
            text = page.extract_text()
            lines = text.split('\n')
            
            for line in lines:
                # Check for answer pattern (e.g., "1. B. Explanation...")
                answer_match = re.match(r'^(\d+)\.\s+([A-D])\.\s+(.+)$', line)
                if answer_match:
                    question_number = int(answer_match.group(1))
                    correct_answer = answer_match.group(2)
                    explanation = answer_match.group(3)
                    
                    answers[question_number] = {
                        'correctAnswer': correct_answer,
                        'explanation': explanation
                    }
    
    return answers

def get_domain_name(domain_number: int) -> str:
    domains = {
        1: 'General Security Concepts',
        2: 'Threats, Vulnerabilities, and Mitigations',
        3: 'Security Architecture',
        4: 'Security Operations',
        5: 'Security Program Management and Oversight'
    }
    return domains.get(domain_number, 'Unknown Domain')

def get_domain_weight(domain_number: int) -> int:
    weights = {
        1: 12,
        2: 22,
        3: 18,
        4: 28,
        5: 20
    }
    return weights.get(domain_number, 0)

def main():
    pdf_path = 'david.pdf'  # Update with actual PDF path
    
    # Extract questions and answers
    questions = extract_questions_from_pdf(pdf_path)
    answers = extract_answers_from_pdf(pdf_path)
    
    # Merge questions with their answers
    for question in questions:
        if question['id'] in answers:
            question['correctAnswer'] = answers[question['id']]['correctAnswer']
            question['explanation'] = answers[question['id']]['explanation']
    
    # Save to JSON file
    with open('src/data/questions.json', 'w') as f:
        json.dump(questions, f, indent=2)

if __name__ == '__main__':
    main() 