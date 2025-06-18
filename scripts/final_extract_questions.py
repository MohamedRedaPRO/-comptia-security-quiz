import json
import re
from typing import List, Dict, Any, Optional
import fitz  # PyMuPDF

class FinalExtractor:
    def __init__(self, pdf_path: str):
        self.pdf_path = pdf_path
        self.domain_info = {
            1: {'name': 'General Security Concepts', 'weight': 12},
            2: {'name': 'Threats, Vulnerabilities, and Mitigations', 'weight': 22},
            3: {'name': 'Security Architecture', 'weight': 18},
            4: {'name': 'Security Operations', 'weight': 28},
            5: {'name': 'Security Program Management and Oversight', 'weight': 20}
        }
        
        # Based on debug output, questions are on these page ranges
        self.question_pages = list(range(23, 236))  # Pages 23-235
        self.answer_pages = list(range(238, 330))   # Answer pages start at 238
    
    def extract_questions_from_page(self, page_num: int) -> List[Dict[str, Any]]:
        """Extract all questions from a single page with proper format handling"""
        doc = fitz.open(self.pdf_path)
        page = doc.load_page(page_num - 1)  # Convert to 0-indexed
        text = page.get_text()
        doc.close()
        
        questions = []
        
        # Split text into lines and clean
        lines = [line.strip() for line in text.split('\n')]
        
        current_question = None
        current_options = []
        question_text_lines = []
        
        i = 0
        while i < len(lines):
            line = lines[i]
            
            if not line:  # Skip empty lines
                i += 1
                continue
            
            # Look for question numbers (e.g., "1. ", "2. ", etc.)
            question_match = re.match(r'^(\d+)\.\s*(.*)$', line)
            if question_match:
                # Save previous question if complete
                if current_question and len(current_options) >= 4:
                    current_question['questionText'] = ' '.join(question_text_lines).strip()
                    current_question['options'] = current_options[:4]
                    questions.append(current_question)
                
                # Start new question
                question_id = int(question_match.group(1))
                question_start = question_match.group(2).strip()
                
                current_question = {
                    'id': question_id,
                    'domain': self.determine_domain(question_id),
                    'questionText': '',
                    'options': [],
                    'correctAnswer': '',
                    'explanation': '',
                    'questionType': 'multiple-choice'
                }
                
                question_text_lines = [question_start] if question_start else []
                current_options = []
            
            # Look for option letters (A., B., C., D.)
            elif re.match(r'^([A-D])\.\s*(.*)$', line):
                option_match = re.match(r'^([A-D])\.\s*(.*)$', line)
                if option_match and current_question:
                    option_letter = option_match.group(1)
                    option_text = option_match.group(2).strip()
                    
                    # If option text is empty, look at next line
                    if not option_text and i + 1 < len(lines):
                        i += 1
                        option_text = lines[i].strip()
                    
                    # Continue reading lines until we hit another option or question
                    j = i + 1
                    while j < len(lines):
                        next_line = lines[j].strip()
                        if not next_line:
                            j += 1
                            continue
                        # Stop if we hit another option or question
                        if re.match(r'^[A-D]\.\s*', next_line) or re.match(r'^\d+\.\s*', next_line):
                            break
                        # Stop if we hit chapter headers or page numbers
                        if re.match(r'^Chapter\s+\d+', next_line) or re.match(r'^\d+\s*$', next_line):
                            break
                        option_text += ' ' + next_line
                        j += 1
                    
                    current_options.append({
                        'letter': option_letter,
                        'text': option_text.strip()
                    })
                    
                    i = j - 1  # Skip processed lines
            
            # Continue question text if we haven't started options yet
            elif current_question and len(current_options) == 0:
                # Skip chapter headers and page numbers
                if not re.match(r'^Chapter\s+\d+', line) and not re.match(r'^\d+\s*$', line):
                    if line and len(line) > 2:  # Ignore very short lines
                        question_text_lines.append(line)
            
            i += 1
        
        # Don't forget the last question
        if current_question and len(current_options) >= 4:
            current_question['questionText'] = ' '.join(question_text_lines).strip()
            current_question['options'] = current_options[:4]
            questions.append(current_question)
        
        return questions
    
    def determine_domain(self, question_id: int) -> Dict[str, Any]:
        """Determine domain based on question ID and typical CompTIA structure"""
        # Based on the book structure, estimate domain boundaries
        if question_id <= 18:  # Domain 1: ~18 questions
            domain_num = 1
        elif question_id <= 45:  # Domain 2: ~27 questions (18+27=45)
            domain_num = 2
        elif question_id <= 63:  # Domain 3: ~18 questions (45+18=63)
            domain_num = 3
        elif question_id <= 90:  # Domain 4: ~27 questions (63+27=90)
            domain_num = 4
        else:  # Domain 5: remaining questions
            domain_num = 5
        
        return {
            'number': domain_num,
            'name': self.domain_info[domain_num]['name'],
            'weight': self.domain_info[domain_num]['weight']
        }
    
    def extract_answers_from_pages(self) -> Dict[int, Dict[str, str]]:
        """Extract answers from answer pages"""
        doc = fitz.open(self.pdf_path)
        answers = {}
        
        for page_num in self.answer_pages:
            if page_num - 1 >= len(doc):
                break
                
            page = doc.load_page(page_num - 1)
            text = page.get_text()
            
            # Look for answer patterns: number, letter, explanation
            # More flexible pattern to handle various formatting
            lines = text.split('\n')
            
            i = 0
            while i < len(lines):
                line = lines[i].strip()
                
                # Look for answer pattern: "1. A." or "1. A. explanation"
                answer_match = re.match(r'^(\d+)\.\s*([A-D])\.\s*(.*)$', line)
                if answer_match:
                    question_id = int(answer_match.group(1))
                    correct_answer = answer_match.group(2)
                    explanation = answer_match.group(3).strip()
                    
                    # If explanation is empty or very short, read next lines
                    if len(explanation) < 10:
                        j = i + 1
                        while j < len(lines):
                            next_line = lines[j].strip()
                            if not next_line:
                                j += 1
                                continue
                            # Stop if we hit another answer
                            if re.match(r'^\d+\.\s*[A-D]\.', next_line):
                                break
                            explanation += ' ' + next_line
                            j += 1
                        i = j - 1
                    
                    # Clean up explanation
                    explanation = re.sub(r'\s+', ' ', explanation).strip()
                    
                    if question_id not in answers and explanation:
                        answers[question_id] = {
                            'correctAnswer': correct_answer,
                            'explanation': explanation
                        }
                
                i += 1
        
        doc.close()
        return answers
    
    def extract_all_questions(self) -> List[Dict[str, Any]]:
        """Extract all questions from all pages"""
        print("Starting final extraction...")
        print(f"Processing {len(self.question_pages)} question pages...")
        
        all_questions = []
        
        # Extract questions from all question pages
        for page_num in self.question_pages:
            try:
                page_questions = self.extract_questions_from_page(page_num)
                all_questions.extend(page_questions)
                if page_questions:
                    print(f"Page {page_num}: Found {len(page_questions)} questions")
            except Exception as e:
                print(f"Error processing page {page_num}: {e}")
                continue
        
        print(f"Total questions extracted: {len(all_questions)}")
        
        # Extract answers
        print("Extracting answers...")
        answers = self.extract_answers_from_pages()
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
        
        # Sort by question ID
        all_questions.sort(key=lambda x: x['id'])
        
        return all_questions

def main():
    pdf_path = 'david.pdf'
    output_path = 'src/data/questions.json'
    
    try:
        extractor = FinalExtractor(pdf_path)
        questions = extractor.extract_all_questions()
        
        print(f"\nExtraction completed!")
        print(f"Total questions: {len(questions)}")
        
        # Save to JSON
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(questions, f, indent=2, ensure_ascii=False)
        
        print(f"Questions saved to: {output_path}")
        
        # Statistics by domain
        domain_stats = {}
        total_with_answers = 0
        
        for q in questions:
            domain_num = q['domain']['number']
            if domain_num not in domain_stats:
                domain_stats[domain_num] = {
                    'count': 0, 
                    'with_answers': 0,
                    'name': q['domain']['name']
                }
            
            domain_stats[domain_num]['count'] += 1
            if q['correctAnswer']:
                domain_stats[domain_num]['with_answers'] += 1
                total_with_answers += 1
        
        print(f"\nDomain Statistics:")
        for domain_num in sorted(domain_stats.keys()):
            stats = domain_stats[domain_num]
            completion = (stats['with_answers']/stats['count']*100) if stats['count'] > 0 else 0
            print(f"Domain {domain_num} ({stats['name']}):")
            print(f"  Questions: {stats['count']}")
            print(f"  With Answers: {stats['with_answers']}")
            print(f"  Completion: {completion:.1f}%")
        
        print(f"\nOverall: {total_with_answers}/{len(questions)} questions with answers ({(total_with_answers/len(questions)*100):.1f}%)")
        
        # Show sample questions
        print(f"\nSample Questions:")
        for i, q in enumerate(questions[:3]):
            print(f"\nQuestion {q['id']} (Domain {q['domain']['number']}):")
            print(f"Text: {q['questionText'][:100]}...")
            print(f"Options: {[opt['letter'] + '. ' + opt['text'][:50] + '...' for opt in q['options']]}")
            if q['correctAnswer']:
                print(f"Answer: {q['correctAnswer']}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main() 