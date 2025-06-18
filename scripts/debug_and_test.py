import json
import re
from typing import Dict, List, Set
import fitz  # PyMuPDF
from collections import Counter

def analyze_current_questions(questions_file: str):
    """Analyze the current questions.json file for issues"""
    print("="*60)
    print("ANALYZING CURRENT QUESTIONS FILE")
    print("="*60)
    
    with open(questions_file, 'r', encoding='utf-8') as f:
        questions = json.load(f)
    
    print(f"Total questions in file: {len(questions)}")
    
    # Check for duplicate IDs
    ids = [q['id'] for q in questions]
    id_counts = Counter(ids)
    duplicates = {id_: count for id_, count in id_counts.items() if count > 1}
    
    if duplicates:
        print(f"\n❌ DUPLICATE IDs FOUND: {len(duplicates)} IDs have duplicates")
        for id_, count in list(duplicates.items())[:10]:  # Show first 10
            print(f"  ID {id_}: appears {count} times")
    else:
        print("✅ No duplicate IDs found")
    
    # Check for empty answers
    empty_answers = sum(1 for q in questions if not q.get('correctAnswer', '').strip())
    print(f"\nQuestions with empty answers: {empty_answers}")
    
    # Check for empty explanations
    empty_explanations = sum(1 for q in questions if not q.get('explanation', '').strip())
    print(f"Questions with empty explanations: {empty_explanations}")
    
    # Check domain distribution
    domain_counts = Counter(q['domain']['number'] for q in questions)
    print(f"\nDomain distribution:")
    for domain in sorted(domain_counts.keys()):
        print(f"  Domain {domain}: {domain_counts[domain]} questions")
    
    # Check for questions with both answer and explanation
    complete_questions = sum(1 for q in questions if q.get('correctAnswer', '').strip() and q.get('explanation', '').strip())
    print(f"\nComplete questions (with both answer and explanation): {complete_questions}")
    
    return questions, duplicates, empty_answers, empty_explanations

def extract_questions_properly(pdf_path: str) -> List[Dict]:
    """Extract questions with proper unique IDs"""
    print("\n" + "="*60)
    print("EXTRACTING QUESTIONS WITH PROPER IDs")
    print("="*60)
    
    doc = fitz.open(pdf_path)
    all_questions = []
    global_question_id = 1  # Use global counter instead of page-based IDs
    
    # Question pages are 23-235
    for page_num in range(23, 236):
        if page_num - 1 >= len(doc):
            continue
            
        page = doc.load_page(page_num - 1)
        text = page.get_text()
        
        # Split text into lines
        lines = [line.strip() for line in text.split('\n')]
        
        current_question = None
        current_options = []
        question_text_lines = []
        
        i = 0
        while i < len(lines):
            line = lines[i]
            
            if not line:
                i += 1
                continue
            
            # Look for question numbers (but use global ID)
            question_match = re.match(r'^(\d+)\.\s*(.*)$', line)
            if question_match:
                # Save previous question if complete
                if current_question and len(current_options) >= 4:
                    current_question['questionText'] = ' '.join(question_text_lines).strip()
                    current_question['options'] = current_options[:4]
                    all_questions.append(current_question)
                
                # Start new question with global ID
                original_id = int(question_match.group(1))
                question_start = question_match.group(2).strip()
                
                current_question = {
                    'id': global_question_id,  # Use global ID
                    'originalId': original_id,  # Keep original for answer matching
                    'pageNumber': page_num,
                    'domain': determine_domain_by_page(page_num),
                    'questionText': '',
                    'options': [],
                    'correctAnswer': '',
                    'explanation': '',
                    'questionType': 'multiple-choice'
                }
                
                question_text_lines = [question_start] if question_start else []
                current_options = []
                global_question_id += 1
            
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
                    
                    i = j - 1
            
            # Continue question text if we haven't started options yet
            elif current_question and len(current_options) == 0:
                # Skip chapter headers and page numbers
                if not re.match(r'^Chapter\s+\d+', line) and not re.match(r'^\d+\s*$', line):
                    if line and len(line) > 2:
                        question_text_lines.append(line)
            
            i += 1
        
        # Don't forget the last question on the page
        if current_question and len(current_options) >= 4:
            current_question['questionText'] = ' '.join(question_text_lines).strip()
            current_question['options'] = current_options[:4]
            all_questions.append(current_question)
    
    doc.close()
    print(f"Extracted {len(all_questions)} questions with unique IDs")
    return all_questions

def determine_domain_by_page(page_num: int) -> Dict:
    """Determine domain based on page number"""
    domain_info = {
        1: {'name': 'General Security Concepts', 'weight': 12},
        2: {'name': 'Threats, Vulnerabilities, and Mitigations', 'weight': 22},
        3: {'name': 'Security Architecture', 'weight': 18},
        4: {'name': 'Security Operations', 'weight': 28},
        5: {'name': 'Security Program Management and Oversight', 'weight': 20}
    }
    
    # Based on the book structure and page ranges
    if page_num <= 48:  # Chapter 1 ends around page 48
        domain_num = 1
    elif page_num <= 87:  # Chapter 2 ends around page 87
        domain_num = 2
    elif page_num <= 133:  # Chapter 3 ends around page 133
        domain_num = 3
    elif page_num <= 187:  # Chapter 4 ends around page 187
        domain_num = 4
    else:  # Chapter 5
        domain_num = 5
    
    return {
        'number': domain_num,
        'name': domain_info[domain_num]['name'],
        'weight': domain_info[domain_num]['weight']
    }

def extract_answers_by_original_id(pdf_path: str) -> Dict[int, Dict[str, str]]:
    """Extract answers using original question IDs from the book"""
    print("\n" + "="*60)
    print("EXTRACTING ANSWERS BY ORIGINAL ID")
    print("="*60)
    
    doc = fitz.open(pdf_path)
    answers = {}
    
    # Answer pages are from 238 onwards
    for page_num in range(238, len(doc)):
        page = doc.load_page(page_num - 1)
        text = page.get_text()
        
        lines = [line.strip() for line in text.split('\n')]
        
        i = 0
        while i < len(lines):
            line = lines[i]
            
            if not line:
                i += 1
                continue
            
            # Look for question number pattern: "1." (might be followed by answer on same line or next line)
            question_num_match = re.match(r'^(\d+)\.\s*(.*)$', line)
            if question_num_match:
                original_question_id = int(question_num_match.group(1))
                remainder = question_num_match.group(2).strip()
                
                # Check if answer letter is on the same line
                if remainder and re.match(r'^[A-D]\.', remainder):
                    # Answer is on same line: "1. B. explanation..."
                    answer_match = re.match(r'^([A-D])\.\s*(.*)$', remainder)
                    if answer_match:
                        correct_answer = answer_match.group(1)
                        explanation_start = answer_match.group(2).strip()
                        explanation_lines = [explanation_start] if explanation_start else []
                    else:
                        i += 1
                        continue
                else:
                    # Answer might be on next line: "1." followed by "B. explanation..."
                    if i + 1 < len(lines):
                        next_line = lines[i + 1].strip()
                        answer_match = re.match(r'^([A-D])\.\s*(.*)$', next_line)
                        if answer_match:
                            correct_answer = answer_match.group(1)
                            explanation_start = answer_match.group(2).strip()
                            explanation_lines = [explanation_start] if explanation_start else []
                            i += 1  # Skip the answer line since we processed it
                        else:
                            i += 1
                            continue
                    else:
                        i += 1
                        continue
                
                # Collect the full explanation from subsequent lines
                j = i + 1
                while j < len(lines):
                    next_line = lines[j].strip()
                    
                    # Stop if we hit another question number
                    if re.match(r'^\d+\.\s*', next_line):
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
                
                if original_question_id not in answers and explanation:
                    answers[original_question_id] = {
                        'correctAnswer': correct_answer,
                        'explanation': explanation
                    }
                
                i = j - 1
            
            i += 1
    
    doc.close()
    print(f"Found answers for {len(answers)} original question IDs")
    return answers

def match_answers_to_questions(questions: List[Dict], answers: Dict[int, Dict[str, str]]) -> List[Dict]:
    """Match answers to questions using original IDs"""
    print("\n" + "="*60)
    print("MATCHING ANSWERS TO QUESTIONS")
    print("="*60)
    
    matched_count = 0
    for question in questions:
        original_id = question.get('originalId')
        if original_id and original_id in answers:
            question['correctAnswer'] = answers[original_id]['correctAnswer']
            question['explanation'] = answers[original_id]['explanation']
            matched_count += 1
    
    print(f"Matched {matched_count} answers to questions")
    return questions

def test_final_data(questions: List[Dict]):
    """Test the final data quality"""
    print("\n" + "="*60)
    print("TESTING FINAL DATA QUALITY")
    print("="*60)
    
    # Check for unique IDs
    ids = [q['id'] for q in questions]
    if len(ids) == len(set(ids)):
        print("✅ All question IDs are unique")
    else:
        print("❌ Duplicate IDs found!")
    
    # Check completeness
    complete_questions = [q for q in questions if q.get('correctAnswer', '').strip() and q.get('explanation', '').strip()]
    print(f"✅ Complete questions: {len(complete_questions)}/{len(questions)} ({len(complete_questions)/len(questions)*100:.1f}%)")
    
    # Check domain distribution
    domain_counts = Counter(q['domain']['number'] for q in questions)
    print(f"\n✅ Domain distribution:")
    for domain in sorted(domain_counts.keys()):
        print(f"  Domain {domain}: {domain_counts[domain]} questions")
    
    # Show sample complete question
    complete_sample = next((q for q in questions if q.get('correctAnswer', '').strip() and q.get('explanation', '').strip()), None)
    if complete_sample:
        print(f"\n✅ Sample complete question:")
        print(f"  ID: {complete_sample['id']}")
        print(f"  Text: {complete_sample['questionText'][:100]}...")
        print(f"  Options: {len(complete_sample['options'])}")
        print(f"  Answer: {complete_sample['correctAnswer']}")
        print(f"  Explanation: {complete_sample['explanation'][:100]}...")
    
    return len(complete_questions)

def main():
    pdf_path = 'david.pdf'
    questions_file = 'src/data/questions.json'
    
    # Step 1: Analyze current file
    current_questions, duplicates, empty_answers, empty_explanations = analyze_current_questions(questions_file)
    
    if duplicates or empty_answers > 50 or empty_explanations > 50:
        print("\n🔧 ISSUES FOUND - REBUILDING DATA FROM SCRATCH")
        
        # Step 2: Extract questions properly
        questions = extract_questions_properly(pdf_path)
        
        # Step 3: Extract answers
        answers = extract_answers_by_original_id(pdf_path)
        
        # Step 4: Match answers to questions
        questions = match_answers_to_questions(questions, answers)
        
        # Step 5: Test final data
        complete_count = test_final_data(questions)
        
        if complete_count > 800:  # Expect at least 800 complete questions
            # Step 6: Save the corrected data
            with open(questions_file, 'w', encoding='utf-8') as f:
                json.dump(questions, f, indent=2, ensure_ascii=False)
            
            print(f"\n🎉 SUCCESS! Saved {len(questions)} questions with {complete_count} complete entries")
        else:
            print(f"\n❌ QUALITY CHECK FAILED - Only {complete_count} complete questions")
    else:
        print("\n✅ Current data looks good!")

if __name__ == '__main__':
    main() 