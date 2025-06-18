import fitz  # PyMuPDF
import re

def debug_pdf_structure(pdf_path: str):
    """Debug script to understand PDF structure"""
    doc = fitz.open(pdf_path)
    
    print(f"PDF has {len(doc)} pages")
    
    # Look at first few pages to understand structure
    for page_num in range(min(20, len(doc))):
        page = doc.load_page(page_num)
        text = page.get_text()
        
        print(f"\n{'='*50}")
        print(f"PAGE {page_num + 1}")
        print(f"{'='*50}")
        
        # Show first 500 characters
        print(text[:500])
        
        # Look for question patterns
        question_matches = re.findall(r'\n\s*(\d+)\.\s+([^\n]{20,100})', text)
        if question_matches:
            print(f"\nFound potential questions on page {page_num + 1}:")
            for match in question_matches[:3]:  # Show first 3
                print(f"  {match[0]}. {match[1]}...")
        
        # Look for option patterns
        option_matches = re.findall(r'\n\s*([A-D])\.\s+([^\n]{10,50})', text)
        if option_matches:
            print(f"\nFound potential options on page {page_num + 1}:")
            for match in option_matches[:3]:  # Show first 3
                print(f"  {match[0]}. {match[1]}...")
    
    doc.close()

def find_actual_question_pages(pdf_path: str):
    """Find pages that actually contain questions"""
    doc = fitz.open(pdf_path)
    question_pages = []
    
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text = page.get_text()
        
        # Look for multiple choice patterns
        question_pattern = r'\n\s*(\d+)\.\s+[A-Z]'  # Question number followed by text starting with capital
        option_pattern = r'\n\s*[A-D]\.\s+'  # Options A, B, C, D
        
        questions = re.findall(question_pattern, text)
        options = re.findall(option_pattern, text)
        
        if len(questions) > 0 and len(options) >= 4:
            question_pages.append({
                'page': page_num + 1,
                'questions': len(questions),
                'options': len(options)
            })
    
    doc.close()
    return question_pages

if __name__ == '__main__':
    pdf_path = 'david.pdf'
    
    print("Debugging PDF structure...")
    debug_pdf_structure(pdf_path)
    
    print("\n" + "="*60)
    print("FINDING ACTUAL QUESTION PAGES")
    print("="*60)
    
    question_pages = find_actual_question_pages(pdf_path)
    print(f"Found {len(question_pages)} pages with questions:")
    for page_info in question_pages:
        print(f"  Page {page_info['page']}: {page_info['questions']} questions, {page_info['options']} options") 