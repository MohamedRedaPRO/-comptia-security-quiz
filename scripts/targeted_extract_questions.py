import json
import re
from typing import List, Dict, Any, Optional
import fitz  # PyMuPDF

class TargetedPDFExtractor:
    def __init__(self, pdf_path: str):
        self.pdf_path = pdf_path
        self.domain_info = {
            1: {'name': 'General Security Concepts', 'weight': 12},
            2: {'name': 'Threats, Vulnerabilities, and Mitigations', 'weight': 22},
            3: {'name': 'Security Architecture', 'weight': 18},
            4: {'name': 'Security Operations', 'weight': 28},
            5: {'name': 'Security Program Management and Oversight', 'weight': 20}
        }
        
        # Define page ranges for each domain based on the book structure
        self.domain_page_ranges = {
            1: (15, 50),   # Domain 1 pages (approximate)
            2: (51, 100),  # Domain 2 pages (approximate)
            3: (101, 150), # Domain 3 pages (approximate)
            4: (151, 200), # Domain 4 pages (approximate)
            5: (201, 235)  # Domain 5 pages (approximate)
        }
        
        # Answer pages start around 238
        self.answer_start_page = 238
    
    def extract_questions_from_pages(self, start_page: int, end_page: int, domain_number: int) -> List[Dict[str, Any]]:
        """Extract questions from specific page range"""
        doc = fitz.open(self.pdf_path)
        questions = []
        
        for page_num in range(start_page - 1, min(end_page, len(doc))):
            page = doc.load_page(page_num)
            text = page.get_text()
            
            # Extract questions from this page
            page_questions = self.parse_questions_from_page_text(text, domain_number, page_num + 1)
            questions.extend(page_questions)
        
        doc.close()
        return questions
    
    def parse_questions_from_page_text(self, text: str, domain_number: int, page_number: int) -> List[Dict[str, Any]]:
        """Parse questions from a single page"""
        questions = []
        
        # Split text into lines and clean up
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        current_question = None
        current_options = []
        question_text_lines = []
        
        i = 0
        while i < len(lines):
            line = lines[i]
            
            # Check if this line starts a new question (number followed by period)
            question_match = re.match(r'^(\d+)\.\s+(.+)', line)
            if question_match:
                # Save previous question if it exists and is complete
                if current_question and len(current_options) >= 4:
                    current_question['questionText'] = ' '.join(question_text_lines).strip()
                    current_question['options'] = current_options[:4]  # Take first 4 options
                    questions.append(current_question)
                
                # Start new question
                question_id = int(question_match.group(1))
                question_start_text = question_match.group(2)
                
                current_question = {
                    'id': question_id,
                    'domain': {
                        'number': domain_number,
                        'name': self.domain_info[domain_number]['name'],
                        'weight': self.domain_info[domain_number]['weight']
                    },
                    'questionText': '',
                    'options': [],
                    'correctAnswer': '',
                    'explanation': '',
                    'questionType': 'multiple-choice'
                }
                
                question_text_lines = [question_start_text]
                current_options = []
            
            # Check if this line is an option (A., B., C., D.)
            elif re.match(r'^([A-D])\.\s+(.+)', line):
                option_match = re.match(r'^([A-D])\.\s+(.+)', line)
                if option_match and current_question:
                    option_letter = option_match.group(1)
                    option_text = option_match.group(2)
                    
                    # Look ahead to see if next lines continue this option
                    j = i + 1
                    while j < len(lines) and not re.match(r'^[A-D]\.\s+', lines[j]) and not re.match(r'^\d+\.\s+', lines[j]):
                        if lines[j].strip():
                            option_text += ' ' + lines[j].strip()
                        j += 1
                    
                    current_options.append({
                        'letter': option_letter,
                        'text': option_text.strip()
                    })
                    
                    i = j - 1  # Skip the lines we've processed
            
            # If we're in a question but haven't hit options yet, this is question text
            elif current_question and len(current_options) == 0 and not re.match(r'^\d+\.\s+', line):
                question_text_lines.append(line)
            
            i += 1
        
        # Don't forget the last question
        if current_question and len(current_options) >= 4:
            current_question['questionText'] = ' '.join(question_text_lines).strip()
            current_question['options'] = current_options[:4]
            questions.append(current_question)
        
        return questions
    
    def extract_answers_from_pages(self, start_page: int) -> Dict[int, Dict[str, str]]:
        """Extract answers from answer pages"""
        doc = fitz.open(self.pdf_path)
        answers = {}
        
        for page_num in range(start_page - 1, len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text()
            
            # Look for answer patterns: number, letter, explanation
            # More flexible pattern to handle various formatting
            answer_patterns = [
                r'(\d+)\.\s*([A-D])\.\s*([^\d]+?)(?=\n\d+\.|$)',  # Standard format
                r'(\d+)\.\s*([A-D])\s*([^\d]+?)(?=\n\d+\.|$)',   # Without period after letter
                r'(\d+)\s*\.\s*([A-D])\s*\.\s*([^\d]+?)(?=\n\d+\.|$)'  # Extra spaces
            ]
            
            for pattern in answer_patterns:
                matches = re.finditer(pattern, text, re.MULTILINE | re.DOTALL)
                for match in matches:
                    question_id = int(match.group(1))
                    correct_answer = match.group(2)
                    explanation = match.group(3).strip()
                    
                    # Clean up explanation
                    explanation = re.sub(r'\s+', ' ', explanation)
                    explanation = re.sub(r'\n+', ' ', explanation)
                    
                    if question_id not in answers:  # Don't overwrite if already found
                        answers[question_id] = {
                            'correctAnswer': correct_answer,
                            'explanation': explanation
                        }
        
        doc.close()
        return answers
    
    def determine_question_domain(self, question_id: int) -> int:
        """Determine which domain a question belongs to based on its ID"""
        # Based on typical CompTIA structure, roughly 18 questions per domain
        if question_id <= 18:
            return 1
        elif question_id <= 36:
            return 2
        elif question_id <= 54:
            return 3
        elif question_id <= 72:
            return 4
        else:
            return 5
    
    def extract_all_questions(self) -> List[Dict[str, Any]]:
        """Main extraction method"""
        print("Starting targeted PDF extraction...")
        
        all_questions = []
        
        # Extract questions from all question pages (15-235)
        print("Extracting questions from pages 15-235...")
        doc = fitz.open(self.pdf_path)
        
        for page_num in range(14, min(235, len(doc))):  # Pages 15-235 (0-indexed)
            page = doc.load_page(page_num)
            text = page.get_text()
            
            # Parse questions from this page
            page_questions = self.parse_questions_from_page_text(text, 1, page_num + 1)  # We'll fix domain later
            all_questions.extend(page_questions)
        
        doc.close()
        
        # Fix domain assignments based on question IDs
        for question in all_questions:
            correct_domain = self.determine_question_domain(question['id'])
            question['domain'] = {
                'number': correct_domain,
                'name': self.domain_info[correct_domain]['name'],
                'weight': self.domain_info[correct_domain]['weight']
            }
        
        print(f"Extracted {len(all_questions)} questions")
        
        # Extract answers
        print("Extracting answers from appendix...")
        answers = self.extract_answers_from_pages(self.answer_start_page)
        print(f"Found {len(answers)} answers")
        
        # Match answers to questions
        matched_count = 0
        for question in all_questions:
            if question['id'] in answers:
                answer_data = answers[question['id']]
                question['correctAnswer'] = answer_data['correctAnswer']
                question['explanation'] = answer_data['explanation']
                matched_count += 1
        
        print(f"Matched {matched_count} answers to questions")
        
        # Sort questions by ID
        all_questions.sort(key=lambda x: x['id'])
        
        return all_questions

def main():
    pdf_path = 'david.pdf'
    output_path = 'src/data/questions.json'
    
    try:
        print("Starting targeted extraction...")
        extractor = TargetedPDFExtractor(pdf_path)
        questions = extractor.extract_all_questions()
        
        print(f"\nExtraction completed!")
        print(f"Total questions: {len(questions)}")
        
        # Save to JSON
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(questions, f, indent=2, ensure_ascii=False)
        
        print(f"Questions saved to: {output_path}")
        
        # Statistics
        domain_stats = {}
        total_with_answers = 0
        
        for q in questions:
            domain_num = q['domain']['number']
            if domain_num not in domain_stats:
                domain_stats[domain_num] = {'count': 0, 'with_answers': 0}
            
            domain_stats[domain_num]['count'] += 1
            if q['correctAnswer']:
                domain_stats[domain_num]['with_answers'] += 1
                total_with_answers += 1
        
        print(f"\nStatistics:")
        print(f"Total questions: {len(questions)}")
        print(f"Questions with answers: {total_with_answers}")
        print(f"Completion rate: {(total_with_answers/len(questions)*100):.1f}%")
        
        for domain_num in sorted(domain_stats.keys()):
            stats = domain_stats[domain_num]
            print(f"Domain {domain_num}: {stats['count']} questions, {stats['with_answers']} with answers")
        
        # Show sample questions
        print(f"\nSample questions:")
        for i, q in enumerate(questions[:3]):
            print(f"\nQuestion {q['id']}:")
            print(f"Text: {q['questionText'][:100]}...")
            print(f"Options: {len(q['options'])}")
            if q['correctAnswer']:
                print(f"Answer: {q['correctAnswer']}")
                print(f"Explanation: {q['explanation'][:100]}...")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main() 