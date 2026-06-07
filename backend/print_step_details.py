import json
import os

def print_details():
    log_path = "/mnt/c/Users/Nhat Anh/.gemini/antigravity/brain/8efca2a2-c3d4-4d49-b727-4f18382915aa/.system_generated/logs/transcript.jsonl"
    if not os.path.exists(log_path):
        print("Log not found")
        return
        
    with open(log_path, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                step = json.loads(line)
                step_idx = step.get('step_index', 0)
                if step_idx == 116:
                    print(f"\n--- STEP {step_idx} ---")
                    for tc in step.get("tool_calls", []):
                        args = tc.get('args', {})
                        chunks = args.get("ReplacementChunks", [])
                        print("Type of chunks raw:", type(chunks))
                        if isinstance(chunks, str):
                            try:
                                chunks = json.loads(chunks)
                            except Exception as ex:
                                print("json.loads failed:", ex)
                                # Try parsing it manually or cleaning quotes
                                # Sometimes it's double escaped
                                try:
                                    chunks = json.loads(json.loads(json.dumps(chunks)))
                                except Exception as ex2:
                                    print("nested json.loads failed:", ex2)
                        
                        print(f"Number of chunks: {len(chunks)}")
                        for i, chunk in enumerate(chunks):
                            print(f"\nChunk {i}:")
                            print("StartLine:", chunk.get("StartLine"))
                            print("EndLine:", chunk.get("EndLine"))
                            print("TargetContent:\n", repr(chunk.get("TargetContent")))
                            print("ReplacementContent:\n", repr(chunk.get("ReplacementContent")))
            except Exception as e:
                print("Step outer exception:", e)

if __name__ == '__main__':
    print_details()
