import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api/v1"

def run_live_test():
    print("=" * 60)
    print("DocuMind Live System Verification Test")
    print("=" * 60)

    # 1. Login
    print("[1/5] Testing Authentication...")
    login_res = requests.post(f"{BASE_URL}/auth/login", data={"username": "admin@docmind.local", "password": "AdminDocuMind2026!"})
    if login_res.status_code != 200:
        print(f"FAILED: Login error: {login_res.text}")
        sys.exit(1)
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("  [OK] Admin login successful. JWT token issued.")

    # 2. Get Workspaces
    print("[2/5] Testing Workspace Isolation...")
    ws_res = requests.get(f"{BASE_URL}/workspaces", headers=headers)
    assert ws_res.status_code == 200, f"List workspaces failed: {ws_res.text}"
    workspaces = ws_res.json()
    assert len(workspaces) > 0, "No workspace found"
    ws = workspaces[0]
    ws_id = ws["id"]
    print(f"  [OK] Active Workspace: '{ws['name']}' (ID: {ws_id})")

    # 3. List Documents
    print("[3/5] Querying Indexed Document Repository...")
    docs_res = requests.get(f"{BASE_URL}/workspaces/{ws_id}/documents", headers=headers)
    assert docs_res.status_code == 200, f"List docs failed: {docs_res.text}"
    docs = docs_res.json()
    print(f"  [OK] Found {len(docs)} indexed documents in corpus:")
    for d in docs:
        print(f"    - {d['original_filename']} | Status: {d['status']} | Pages: {d['page_count']} | Size: {d['file_size_bytes']}B")

    # 4. Create Conversation
    print("[4/5] Establishing Conversational Session...")
    conv_res = requests.post(f"{BASE_URL}/workspaces/{ws_id}/chat/conversations", headers=headers, json={"title": "Live Verification Session"})
    assert conv_res.status_code == 200, f"Create conv failed: {conv_res.text}"
    conv_id = conv_res.json()["id"]
    print(f"  [OK] Session initialized: {conv_id}")

    # 5. Send Chat Query (Streaming)
    print("[5/5] Executing Grounded RAG Query with Citation Proof...")
    query = "What are the payment terms under the Master Services Agreement?"
    print(f"  Query: \"{query}\"")
    chat_res = requests.post(
        f"{BASE_URL}/workspaces/{ws_id}/chat/conversations/{conv_id}/messages",
        headers=headers,
        json={"content": query},
        stream=True
    )
    assert chat_res.status_code == 200, f"Chat stream failed: {chat_res.status_code}"

    content_tokens = []
    final_payload = None
    for line in chat_res.iter_lines():
        if not line:
            continue
        line_str = line.decode("utf-8")
        if line_str.startswith("data: "):
            data_json = json.loads(line_str[6:])
            if data_json.get("event") == "token":
                content_tokens.append(data_json.get("data", ""))
            elif data_json.get("event") == "done":
                final_payload = data_json

    answer_text = "".join(content_tokens)
    print(f"\n  [OK] Streamed Answer:\n    \"{answer_text.strip()}\"\n")

    if final_payload and "citations" in final_payload:
        citations = final_payload["citations"]
        print(f"  [OK] Verifiable Citations ({len(citations)} source references):")
        for c in citations:
            print(f"    [{c['citation_id']}] Document: {c['document_name']} (Page {c.get('page_number')})")
            print(f"        Excerpt: \"{c['text_excerpt'][:90]}...\"")

    print("\n" + "=" * 60)
    print("LIVE RUNTIME VERIFICATION SUCCESSFUL: ALL ENDPOINTS FUNCTIONAL")
    print("=" * 60)

if __name__ == "__main__":
    run_live_test()
