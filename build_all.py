# Build script for Company Scraper Extension
import os
import json

base = r'c:\Users\Raksh\Downloads\JobJockey\Pro\company-scraper-extension'

def write(path, content):
    full = os.path.join(base, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')
    print(f'Created: {path}')

print('Script initialized.')
