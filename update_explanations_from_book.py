import json
import re

def clean_text(text):
    # Remove extra whitespace and normalize
    return re.sub(r'\s+', ' ', text).strip().lower()

# Load app questions
with open('src/data/questions.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

# Load book explanations
with open('book_explanations.json', 'r', encoding='utf-8') as f:
    book_explanations = json.load(f)

# Build lookups
book_lookup = {}
for e in book_explanations:
    if 'domain' in e and e['domain'] is not None:
        key = (e['domain'], e['number'])
        book_lookup[key] = {
            'explanation': e['explanation'],
            'answer': e['answer']
        }

updated = 0
not_found = 0

for q in questions:
    qnum = q.get('originalId') or q.get('id')
    domain = q.get('domain', {}).get('number')
    
    if not (qnum and domain):
        not_found += 1
        continue
        
    key = (int(domain), int(qnum))
    if key in book_lookup:
        q['explanation'] = book_lookup[key]['explanation']
        q['correctAnswer'] = book_lookup[key]['answer']
        updated += 1
    else:
        not_found += 1

print(f'Updated explanations and answers for {updated} questions')
print(f'Not found: {not_found}')

# Save the updated questions
with open('src/data/questions_with_book_explanations.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False, indent=2) 