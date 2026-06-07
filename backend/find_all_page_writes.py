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
                    if "page.tsx" in target_file:
                        print(f"Step {step.get('step_index', 0)}: {target_file}")
            except Exception as e:
                pass

if __name__ == '__main__':
    find_writes()
