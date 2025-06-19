import pdfplumber
import re
import json

PDF_PATH = '/home/mohamed/Downloads/david.pdf'
START_PAGE = 217

explanation_pattern = re.compile(r'^(\d+)\.\s*([A-D])\.\s*(.*)')
domain_pattern = re.compile(r'Domain (\d+)\.', re.IGNORECASE)

explanations = []
current_explanation = None
current_domain = 0 

with pdfplumber.open(PDF_PATH) as pdf:
    for i in range(START_PAGE, len(pdf.pages)):
        page = pdf.pages[i]
        text = page.extract_text(x_tolerance=2, y_tolerance=5)
        if not text:
            continue

        lines = text.split('\n')

        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            domain_match = domain_pattern.search(line)
            if domain_match:
                current_domain = int(domain_match.group(1))

            match = explanation_pattern.match(line)
            if match:
                if current_explanation:
                    explanations.append(current_explanation)

                num = int(match.group(1))
                answer = match.group(2)
                explanation_text = match.group(3)
                
                domain_to_assign = current_domain if current_domain > 0 else 1

                current_explanation = {
                    "number": num,
                    "answer": answer,
                    "explanation": explanation_text,
                    "page": i + 1,
                    "domain": domain_to_assign
                }
            elif current_explanation:
                if not domain_pattern.search(line):
                     current_explanation['explanation'] += ' ' + line

    if current_explanation:
        explanations.append(current_explanation)

for e in explanations:
    e['explanation'] = re.sub(r'\s+', ' ', e['explanation']).strip()
    e['explanation'] = re.sub(r'Chapter \d+:? Domain \d+\.\d+:?.*? \d+$', '', e['explanation']).strip()


print(f'Extracted: {len(explanations)} explanations')
print(json.dumps(explanations[:5], indent=2, ensure_ascii=False))

with open('book_explanations.json', 'w', encoding='utf-8') as f:
    json.dump(explanations, f, ensure_ascii=False, indent=2) 