import fitz  # PyMuPDF

def examine_pages(pdf_path: str, pages_to_check: list):
    """Examine specific pages to understand text structure"""
    doc = fitz.open(pdf_path)
    
    for page_num in pages_to_check:
        if page_num - 1 >= len(doc):
            continue
            
        page = doc.load_page(page_num - 1)
        text = page.get_text()
        
        print(f"\n{'='*60}")
        print(f"PAGE {page_num} - RAW TEXT")
        print(f"{'='*60}")
        print(text[:2000])  # First 2000 characters
        print(f"\n{'='*60}")
        print(f"PAGE {page_num} - LINES")
        print(f"{'='*60}")
        lines = text.split('\n')
        for i, line in enumerate(lines[:50]):  # First 50 lines
            if line.strip():
                print(f"{i:2d}: {repr(line)}")
    
    doc.close()

if __name__ == '__main__':
    pdf_path = 'david.pdf'
    # Check a few pages that should have questions
    pages_to_check = [23, 24, 25, 52, 53]
    examine_pages(pdf_path, pages_to_check) 