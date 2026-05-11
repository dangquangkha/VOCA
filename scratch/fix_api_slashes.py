import os
import re

def fix_slashes(directory):
    # Regex updated to handle optional generic types like <DailyProgress[]>
    pattern = re.compile(r"(api\.(get|post|put|patch|delete)(<.*?>)?\(\s*)(['\"`])\/")
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                path = os.path.join(root, file)
                with open(path, 'r') as f:
                    content = f.read()
                
                new_content = pattern.sub(r"\1\4", content)
                
                if new_content != content:
                    print(f"Fixing {path}")
                    with open(path, 'w') as f:
                        f.write(new_content)

if __name__ == "__main__":
    fix_slashes("frontend/src")
