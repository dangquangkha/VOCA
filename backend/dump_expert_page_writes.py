import json
import os

def find_writes():
    log_path = "/mnt/c/Users/Nhat Anh/.gemini/antigravity/brain/8efca2a2-c3d4-4d49-b727-4f18382915aa/.system_generated/logs/transcript.jsonl"
    if not os.path.exists(log_path):
        print("Log not found")
        return
        
    with open(log_path, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                step = json.loads(line)
                tool_calls = step.get("tool_calls", [])
                for call in tool_calls:
                    args = call.get("args", {})
                    target_file = args.get("TargetFile", "") or args.get("targetFile", "") or args.get("AbsolutePath", "")
                    if not target_file:
                        continue
                    clean_target = target_file.lower().replace("\\", "/")
                    if "experts" in clean_target and "page.tsx" in clean_target and "[id]" in clean_target and "book" not in clean_target:
                        content = args.get("CodeContent", "") or args.get("ReplacementContent", "") or args.get("content", "")
                        print(f"Step {step.get('step_index', 0)}: {target_file} | Content length: {len(content)}")
                        if len(content) > 0:
                            # Save to a temp file in /home/hat_n/projects/CareerPath_AI_Project/backend/
                            temp_name = f"/home/hat_n/projects/CareerPath_AI_Project/backend/page_step_{step.get('step_index', 0)}.tsx"
                            with open(temp_name, 'w', encoding='utf-8') as out_f:
                                out_f.write(content)
                            print(f"Saved to {temp_name}")
            except Exception as e:
                pass

if __name__ == '__main__':
    find_writes()
