import json
import re
from typing import Dict
import fitz  # PyMuPDF

def extract_answers_properly(pdf_path: str) -> Dict[int, Dict[str, str]]:
    """Extract answers and explanations with proper parsing"""
    doc = fitz.open(pdf_path)
    answers = {}
    
    # Answer pages are from 238 onwards
    for page_num in range(238, len(doc)):
        page = doc.load_page(page_num - 1)
        text = page.get_text()
        
        # Split into lines
        lines = [line.strip() for line in text.split('\n')]
        
        i = 0
        while i < len(lines):
            line = lines[i]
            
            if not line:
                i += 1
                continue
            
            # Look for answer pattern: "1. B." or just "1."
            answer_match = re.match(r'^(\d+)\.\s*([A-D])\.\s*(.*)$', line)
            if answer_match:
                question_id = int(answer_match.group(1))
                correct_answer = answer_match.group(2)
                explanation_start = answer_match.group(3).strip()
                
                # Collect the full explanation by reading subsequent lines
                explanation_lines = [explanation_start] if explanation_start else []
                
                j = i + 1
                while j < len(lines):
                    next_line = lines[j].strip()
                    
                    # Stop if we hit another answer (number followed by letter)
                    if re.match(r'^\d+\.\s*[A-D]\.', next_line):
                        break
                    
                    # Stop if we hit chapter headers or page numbers
                    if re.match(r'^Chapter\s+\d+', next_line) or re.match(r'^\d+\s*$', next_line):
                        break
                    
                    # Stop if we hit "Appendix" 
                    if 'Appendix' in next_line:
                        break
                    
                    if next_line:
                        explanation_lines.append(next_line)
                    
                    j += 1
                
                # Clean up explanation
                explanation = ' '.join(explanation_lines).strip()
                explanation = re.sub(r'\s+', ' ', explanation)
                
                if question_id not in answers and explanation:
                    answers[question_id] = {
                        'correctAnswer': correct_answer,
                        'explanation': explanation
                    }
                    print(f"Found answer for question {question_id}: {correct_answer}")
                
                i = j - 1
            
            i += 1
    
    doc.close()
    return answers

def update_questions_with_answers(questions_file: str, answers: Dict[int, Dict[str, str]]):
    """Update the questions.json file with proper answers and explanations"""
    
    # Load existing questions
    with open(questions_file, 'r', encoding='utf-8') as f:
        questions = json.load(f)
    
    # Update questions with answers
    updated_count = 0
    for question in questions:
        question_id = question['id']
        if question_id in answers:
            question['correctAnswer'] = answers[question_id]['correctAnswer']
            question['explanation'] = answers[question_id]['explanation']
            updated_count += 1
    
    # Save updated questions
    with open(questions_file, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    
    print(f"Updated {updated_count} questions with answers and explanations")
    return updated_count

def main():
    pdf_path = 'david.pdf'
    questions_file = 'src/data/questions.json'
    
    print("Extracting answers from PDF...")
    answers = extract_answers_properly(pdf_path)
    print(f"Found {len(answers)} answers")
    
    print("Updating questions with answers...")
    updated_count = update_questions_with_answers(questions_file, answers)
    
    print(f"\nCompleted! Updated {updated_count} out of {len(answers)} questions")
    
    # Show some sample answers
    print("\nSample answers:")
    for i, (q_id, answer_data) in enumerate(list(answers.items())[:3]):
        print(f"\nQuestion {q_id}:")
        print(f"Answer: {answer_data['correctAnswer']}")
        print(f"Explanation: {answer_data['explanation'][:100]}...")

if __name__ == '__main__':
    main() 