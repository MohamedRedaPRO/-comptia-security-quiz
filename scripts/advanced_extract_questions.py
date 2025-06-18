import json
import re
from typing import List, Dict, Any, Optional
import PyPDF2
from dataclasses import dataclass

@dataclass
class QuestionData:
    id: int
    text: str
    options: List[Dict[str, str]]
    domain_number: int

@dataclass
class AnswerData:
    question_id: int
    correct_answer: str
    explanation: str

class ComprehensivePDFExtractor:
    def __init__(self, pdf_path: str):
        self.pdf_path = pdf_path
        self.questions: List[QuestionData] = []
        self.answers: Dict[int, AnswerData] = {}
        
    def extract_all_text(self) -> str:
        """Extract all text from PDF as a single string for better parsing"""
        full_text = ""
        with open(self.pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            for page_num, page in enumerate(reader.pages):
                text = page.extract_text()
                # Add page markers to help with section identification
                full_text += f"\n--- PAGE {page_num + 1} ---\n" + text
        return full_text
    
    def find_chapter_boundaries(self, text: str) -> Dict[int, tuple]:
        """Find the start and end positions of each chapter"""
        chapter_patterns = [
            r"Chapter\s+1.*?Domain\s+1\.0.*?General\s+Security\s+Concepts",
            r"Chapter\s+2.*?Domain\s+2\.0.*?Threats.*?Vulnerabilities.*?Mitigations",
            r"Chapter\s+3.*?Domain\s+3\.0.*?Security\s+Architecture",
            r"Chapter\s+4.*?Domain\s+4\.0.*?Security\s+Operations",
            r"Chapter\s+5.*?Domain\s+5\.0.*?Security\s+Program\s+Management"
        ]
        
        boundaries = {}
        for i, pattern in enumerate(chapter_patterns, 1):
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                boundaries[i] = (match.start(), match.end())
        
        # Find appendix start
        appendix_match = re.search(r"Appendix.*?Answers\s+to\s+Review\s+Questions", text, re.IGNORECASE | re.DOTALL)
        if appendix_match:
            boundaries['appendix'] = (appendix_match.start(), len(text))
            
        return boundaries
    
    def extract_questions_from_chapter(self, chapter_text: str, domain_number: int) -> List[QuestionData]:
        """Extract questions from a specific chapter with better parsing"""
        questions = []
        
        # Split by question numbers, but be more flexible
        # Look for patterns like "1.", "2.", etc. at the beginning of lines
        question_splits = re.split(r'\n\s*(\d+)\.\s+', chapter_text)
        
        for i in range(1, len(question_splits), 2):
            if i + 1 < len(question_splits):
                question_num = int(question_splits[i])
                question_content = question_splits[i + 1]
                
                # Extract question text and options
                question_data = self.parse_question_content(question_content, question_num, domain_number)
                if question_data:
                    questions.append(question_data)
        
        return questions
    
    def parse_question_content(self, content: str, question_id: int, domain_number: int) -> Optional[QuestionData]:
        """Parse individual question content to extract text and options"""
        lines = content.strip().split('\n')
        question_text_lines = []
        options = []
        current_option = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Check if this line starts an option (A., B., C., D.)
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
                # Continue previous option text
                current_option['text'] += ' ' + line
            elif not current_option:
                # This is part of the question text
                question_text_lines.append(line)
            
        # Add the last option
        if current_option:
            options.append(current_option)
        
        # Clean up question text
        question_text = ' '.join(question_text_lines).strip()
        
        # Validate we have a complete question
        if question_text and len(options) >= 4:
            return QuestionData(
                id=question_id,
                text=question_text,
                options=options,
                domain_number=domain_number
            )
        
        return None
    
    def extract_answers_from_appendix(self, appendix_text: str) -> Dict[int, AnswerData]:
        """Extract answers and explanations from appendix"""
        answers = {}
        
        # Split by answer numbers
        answer_splits = re.split(r'\n\s*(\d+)\.\s*([A-D])\.\s*', appendix_text)
        
        for i in range(1, len(answer_splits), 3):
            if i + 2 < len(answer_splits):
                question_id = int(answer_splits[i])
                correct_answer = answer_splits[i + 1]
                explanation = answer_splits[i + 2].strip()
                
                # Clean up explanation text
                explanation = re.sub(r'\s+', ' ', explanation)
                explanation = explanation.replace('\n', ' ').strip()
                
                answers[question_id] = AnswerData(
                    question_id=question_id,
                    correct_answer=correct_answer,
                    explanation=explanation
                )
        
        return answers
    
    def get_domain_info(self, domain_number: int) -> Dict[str, Any]:
        """Get domain information"""
        domains = {
            1: {'name': 'General Security Concepts', 'weight': 12},
            2: {'name': 'Threats, Vulnerabilities, and Mitigations', 'weight': 22},
            3: {'name': 'Security Architecture', 'weight': 18},
            4: {'name': 'Security Operations', 'weight': 28},
            5: {'name': 'Security Program Management and Oversight', 'weight': 20}
        }
        return domains.get(domain_number, {'name': 'Unknown Domain', 'weight': 0})
    
    def extract_all_questions(self) -> List[Dict[str, Any]]:
        """Main extraction method"""
        print("Extracting all text from PDF...")
        full_text = self.extract_all_text()
        
        print("Finding chapter boundaries...")
        boundaries = self.find_chapter_boundaries(full_text)
        
        all_questions = []
        
        # Extract questions from each chapter
        for domain_num in range(1, 6):
            if domain_num in boundaries:
                print(f"Extracting questions from Domain {domain_num}...")
                start_pos = boundaries[domain_num][0]
                
                # Find end position (start of next chapter or appendix)
                end_pos = len(full_text)
                for next_domain in range(domain_num + 1, 6):
                    if next_domain in boundaries:
                        end_pos = boundaries[next_domain][0]
                        break
                if 'appendix' in boundaries:
                    end_pos = min(end_pos, boundaries['appendix'][0])
                
                chapter_text = full_text[start_pos:end_pos]
                questions = self.extract_questions_from_chapter(chapter_text, domain_num)
                
                print(f"Found {len(questions)} questions in Domain {domain_num}")
                
                # Convert to final format
                domain_info = self.get_domain_info(domain_num)
                for q in questions:
                    question_dict = {
                        'id': q.id,
                        'domain': {
                            'number': domain_num,
                            'name': domain_info['name'],
                            'weight': domain_info['weight']
                        },
                        'questionText': q.text,
                        'options': q.options,
                        'correctAnswer': '',
                        'explanation': '',
                        'questionType': 'multiple-choice'
                    }
                    all_questions.append(question_dict)
        
        # Extract answers from appendix
        if 'appendix' in boundaries:
            print("Extracting answers from appendix...")
            appendix_text = full_text[boundaries['appendix'][0]:]
            answers = self.extract_answers_from_appendix(appendix_text)
            
            print(f"Found {len(answers)} answers")
            
            # Match answers to questions
            for question in all_questions:
                if question['id'] in answers:
                    answer_data = answers[question['id']]
                    question['correctAnswer'] = answer_data.correct_answer
                    question['explanation'] = answer_data.explanation
        
        return all_questions

def main():
    pdf_path = 'david.pdf'
    output_path = 'src/data/questions.json'
    
    print(f"Starting comprehensive extraction from {pdf_path}")
    
    extractor = ComprehensivePDFExtractor(pdf_path)
    questions = extractor.extract_all_questions()
    
    print(f"Successfully extracted {len(questions)} questions")
    
    # Save to JSON file
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    
    print(f"Questions saved to {output_path}")
    
    # Print some statistics
    domain_counts = {}
    answered_count = 0
    for q in questions:
        domain_num = q['domain']['number']
        domain_counts[domain_num] = domain_counts.get(domain_num, 0) + 1
        if q['correctAnswer']:
            answered_count += 1
    
    print("\nExtraction Statistics:")
    print(f"Total questions: {len(questions)}")
    print(f"Questions with answers: {answered_count}")
    for domain_num in sorted(domain_counts.keys()):
        print(f"Domain {domain_num}: {domain_counts[domain_num]} questions")

if __name__ == '__main__':
    main() 