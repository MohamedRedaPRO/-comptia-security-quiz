import json
import re
from typing import List, Dict, Any, Optional, Tuple
import fitz  # PyMuPDF
import pdfplumber
from dataclasses import dataclass

@dataclass
class ExtractedQuestion:
    id: int
    text: str
    options: List[Dict[str, str]]
    domain_number: int
    page_number: int

@dataclass
class ExtractedAnswer:
    question_id: int
    correct_answer: str
    explanation: str

class RobustPDFExtractor:
    def __init__(self, pdf_path: str):
        self.pdf_path = pdf_path
        self.domain_info = {
            1: {'name': 'General Security Concepts', 'weight': 12},
            2: {'name': 'Threats, Vulnerabilities, and Mitigations', 'weight': 22},
            3: {'name': 'Security Architecture', 'weight': 18},
            4: {'name': 'Security Operations', 'weight': 28},
            5: {'name': 'Security Program Management and Oversight', 'weight': 20}
        }
    
    def extract_with_pdfplumber(self) -> str:
        """Extract text using pdfplumber for better formatting preservation"""
        full_text = ""
        try:
            with pdfplumber.open(self.pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    text = page.extract_text()
                    if text:
                        full_text += f"\n=== PAGE {page_num + 1} ===\n{text}\n"
        except Exception as e:
            print(f"pdfplumber extraction failed: {e}")
        return full_text
    
    def extract_with_pymupdf(self) -> str:
        """Extract text using PyMuPDF for better text recognition"""
        full_text = ""
        try:
            doc = fitz.open(self.pdf_path)
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text = page.get_text()
                if text:
                    full_text += f"\n=== PAGE {page_num + 1} ===\n{text}\n"
            doc.close()
        except Exception as e:
            print(f"PyMuPDF extraction failed: {e}")
        return full_text
    
    def get_best_text_extraction(self) -> str:
        """Try multiple extraction methods and return the best one"""
        print("Trying pdfplumber extraction...")
        pdfplumber_text = self.extract_with_pdfplumber()
        
        print("Trying PyMuPDF extraction...")
        pymupdf_text = self.extract_with_pymupdf()
        
        # Choose the extraction with more content
        if len(pymupdf_text) > len(pdfplumber_text):
            print("Using PyMuPDF extraction (better content)")
            return pymupdf_text
        else:
            print("Using pdfplumber extraction (better content)")
            return pdfplumber_text
    
    def find_question_sections(self, text: str) -> Dict[str, Tuple[int, int]]:
        """Find the boundaries of question sections and appendix"""
        sections = {}
        
        # Look for chapter headers with more flexible patterns
        chapter_patterns = {
            'chapter1': r'(?i)chapter\s*1\b.*?(?:domain\s*1\.0|general\s+security\s+concepts)',
            'chapter2': r'(?i)chapter\s*2\b.*?(?:domain\s*2\.0|threats.*?vulnerabilities)',
            'chapter3': r'(?i)chapter\s*3\b.*?(?:domain\s*3\.0|security\s+architecture)',
            'chapter4': r'(?i)chapter\s*4\b.*?(?:domain\s*4\.0|security\s+operations)',
            'chapter5': r'(?i)chapter\s*5\b.*?(?:domain\s*5\.0|security\s+program)',
            'appendix': r'(?i)appendix.*?(?:answers?\s+to\s+(?:review\s+)?questions?|answer\s+key)'
        }
        
        for section_name, pattern in chapter_patterns.items():
            matches = list(re.finditer(pattern, text, re.DOTALL))
            if matches:
                # Take the first match
                match = matches[0]
                sections[section_name] = (match.start(), match.end())
                print(f"Found {section_name} at position {match.start()}")
        
        return sections
    
    def extract_questions_from_text(self, text: str, domain_number: int, start_pos: int = 0, end_pos: int = None) -> List[ExtractedQuestion]:
        """Extract questions from a text section with improved parsing"""
        if end_pos is None:
            end_pos = len(text)
        
        section_text = text[start_pos:end_pos]
        questions = []
        
        # More robust question splitting
        # Look for numbered questions with various formatting
        question_pattern = r'\n\s*(\d+)\.\s+([^\n]+(?:\n(?!\s*[A-D]\.\s)[^\n]*)*)'
        question_matches = re.finditer(question_pattern, section_text, re.MULTILINE)
        
        for match in question_matches:
            question_num = int(match.group(1))
            question_text_raw = match.group(2).strip()
            
            # Find the end of this question (start of next question or options)
            question_start = match.end()
            next_question = re.search(r'\n\s*\d+\.\s+', section_text[question_start:])
            
            if next_question:
                question_end = question_start + next_question.start()
            else:
                question_end = len(section_text)
            
            # Extract the full question content including options
            full_question_text = section_text[match.start():question_end]
            
            # Parse this question
            parsed_question = self.parse_single_question(full_question_text, question_num, domain_number)
            if parsed_question:
                questions.append(parsed_question)
        
        return questions
    
    def parse_single_question(self, question_text: str, question_id: int, domain_number: int) -> Optional[ExtractedQuestion]:
        """Parse a single question with its options"""
        lines = [line.strip() for line in question_text.split('\n') if line.strip()]
        
        if not lines:
            return None
        
        # First line should contain question number and start of question
        first_line = lines[0]
        question_match = re.match(r'(\d+)\.\s+(.+)', first_line)
        if not question_match:
            return None
        
        question_text_parts = [question_match.group(2)]
        options = []
        current_option = None
        
        # Process remaining lines
        for line in lines[1:]:
            # Check if this is an option line
            option_match = re.match(r'^([A-D])\.\s*(.+)', line)
            if option_match:
                # Save previous option if exists
                if current_option:
                    options.append(current_option)
                
                current_option = {
                    'letter': option_match.group(1),
                    'text': option_match.group(2).strip()
                }
            elif current_option and line and not re.match(r'^\d+\.', line):
                # Continue current option
                current_option['text'] += ' ' + line
            elif not current_option and not re.match(r'^[A-D]\.', line):
                # Continue question text
                question_text_parts.append(line)
        
        # Add the last option
        if current_option:
            options.append(current_option)
        
        # Clean up question text
        question_text = ' '.join(question_text_parts).strip()
        
        # Validate question
        if len(options) >= 4 and question_text:
            return ExtractedQuestion(
                id=question_id,
                text=question_text,
                options=options[:4],  # Take only first 4 options
                domain_number=domain_number,
                page_number=0  # We'll set this later if needed
            )
        
        return None
    
    def extract_answers_from_appendix(self, appendix_text: str) -> Dict[int, ExtractedAnswer]:
        """Extract answers and explanations from appendix with better parsing"""
        answers = {}
        
        # Look for answer patterns with more flexibility
        # Pattern: number, letter, explanation
        answer_pattern = r'\n\s*(\d+)\.\s*([A-D])\.\s*([^\n]+(?:\n(?!\s*\d+\.\s*[A-D]\.)[^\n]*)*)'
        
        for match in re.finditer(answer_pattern, appendix_text, re.MULTILINE | re.DOTALL):
            question_id = int(match.group(1))
            correct_answer = match.group(2)
            explanation_raw = match.group(3)
            
            # Clean up explanation
            explanation = re.sub(r'\s+', ' ', explanation_raw).strip()
            explanation = re.sub(r'\n+', ' ', explanation)
            
            answers[question_id] = ExtractedAnswer(
                question_id=question_id,
                correct_answer=correct_answer,
                explanation=explanation
            )
        
        return answers
    
    def extract_all_questions(self) -> List[Dict[str, Any]]:
        """Main extraction method with comprehensive approach"""
        print("Starting robust PDF extraction...")
        
        # Get the best text extraction
        full_text = self.get_best_text_extraction()
        
        if not full_text:
            raise Exception("Failed to extract any text from PDF")
        
        print(f"Extracted {len(full_text)} characters of text")
        
        # Find section boundaries
        sections = self.find_question_sections(full_text)
        
        all_questions = []
        
        # Extract questions from each chapter
        for domain_num in range(1, 6):
            chapter_key = f'chapter{domain_num}'
            if chapter_key in sections:
                print(f"Processing Domain {domain_num}...")
                
                # Determine section boundaries
                start_pos = sections[chapter_key][1]  # End of chapter header
                
                # Find end position
                end_pos = len(full_text)
                for next_domain in range(domain_num + 1, 6):
                    next_chapter_key = f'chapter{next_domain}'
                    if next_chapter_key in sections:
                        end_pos = sections[next_chapter_key][0]
                        break
                
                if 'appendix' in sections:
                    end_pos = min(end_pos, sections['appendix'][0])
                
                # Extract questions from this domain
                domain_questions = self.extract_questions_from_text(
                    full_text, domain_num, start_pos, end_pos
                )
                
                print(f"Found {len(domain_questions)} questions in Domain {domain_num}")
                
                # Convert to final format
                for q in domain_questions:
                    question_dict = {
                        'id': q.id,
                        'domain': {
                            'number': domain_num,
                            'name': self.domain_info[domain_num]['name'],
                            'weight': self.domain_info[domain_num]['weight']
                        },
                        'questionText': q.text,
                        'options': q.options,
                        'correctAnswer': '',
                        'explanation': '',
                        'questionType': 'multiple-choice'
                    }
                    all_questions.append(question_dict)
        
        # Extract answers from appendix
        if 'appendix' in sections:
            print("Processing appendix for answers...")
            appendix_start = sections['appendix'][1]
            appendix_text = full_text[appendix_start:]
            
            answers = self.extract_answers_from_appendix(appendix_text)
            print(f"Found {len(answers)} answers in appendix")
            
            # Match answers to questions
            matched_count = 0
            for question in all_questions:
                if question['id'] in answers:
                    answer = answers[question['id']]
                    question['correctAnswer'] = answer.correct_answer
                    question['explanation'] = answer.explanation
                    matched_count += 1
            
            print(f"Matched {matched_count} answers to questions")
        
        return all_questions

def main():
    pdf_path = 'david.pdf'
    output_path = 'src/data/questions.json'
    
    try:
        print("Starting robust PDF extraction...")
        extractor = RobustPDFExtractor(pdf_path)
        questions = extractor.extract_all_questions()
        
        print(f"\nExtraction completed successfully!")
        print(f"Total questions extracted: {len(questions)}")
        
        # Save to JSON
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(questions, f, indent=2, ensure_ascii=False)
        
        print(f"Questions saved to: {output_path}")
        
        # Print detailed statistics
        print("\n" + "="*50)
        print("EXTRACTION STATISTICS")
        print("="*50)
        
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
        
        print(f"Total Questions: {len(questions)}")
        print(f"Questions with Answers: {total_with_answers}")
        print(f"Completion Rate: {(total_with_answers/len(questions)*100):.1f}%")
        print()
        
        for domain_num in sorted(domain_stats.keys()):
            stats = domain_stats[domain_num]
            completion = (stats['with_answers']/stats['count']*100) if stats['count'] > 0 else 0
            print(f"Domain {domain_num} ({stats['name']}):")
            print(f"  Questions: {stats['count']}")
            print(f"  With Answers: {stats['with_answers']}")
            print(f"  Completion: {completion:.1f}%")
            print()
        
        # Show sample questions for verification
        print("="*50)
        print("SAMPLE QUESTIONS (for verification)")
        print("="*50)
        
        for i, q in enumerate(questions[:3]):
            print(f"\nQuestion {q['id']} (Domain {q['domain']['number']}):")
            print(f"Text: {q['questionText'][:100]}...")
            print(f"Options: {len(q['options'])}")
            if q['correctAnswer']:
                print(f"Answer: {q['correctAnswer']}")
                print(f"Explanation: {q['explanation'][:100]}...")
            else:
                print("No answer found")
        
    except Exception as e:
        print(f"Extraction failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main() 