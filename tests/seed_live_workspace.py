import os
import requests

BASE_URL = "http://127.0.0.1:8000/api/v1"

def seed_synthetic_docs():
    # 1. Login
    login_res = requests.post(f"{BASE_URL}/auth/login", data={"username": "admin@docmind.local", "password": "AdminDocuMind2026!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get workspace
    ws_res = requests.get(f"{BASE_URL}/workspaces", headers=headers)
    ws_id = ws_res.json()[0]["id"]

    fixtures_dir = os.path.join(os.path.dirname(__file__), "fixtures")
    files_to_upload = [
        "synthetic_master_services_agreement.pdf",
        "synthetic_vendor_invoice.pdf",
        "synthetic_security_policy.txt",
        "synthetic_scanned_receipt.png"
    ]

    print(f"Uploading {len(files_to_upload)} synthetic fixtures to Workspace {ws_id}...")
    for fname in files_to_upload:
        fpath = os.path.join(fixtures_dir, fname)
        if not os.path.exists(fpath):
            print(f"File not found: {fpath}")
            continue
        
        with open(fpath, "rb") as f:
            mime = "application/pdf" if fname.endswith(".pdf") else ("text/plain" if fname.endswith(".txt") else "image/png")
            upload_res = requests.post(
                f"{BASE_URL}/workspaces/{ws_id}/documents/upload",
                headers=headers,
                files=[("files", (fname, f, mime))]
            )
            print(f"Uploaded {fname}: Status {upload_res.status_code}")

    # Check documents list
    docs = requests.get(f"{BASE_URL}/workspaces/{ws_id}/documents", headers=headers).json()
    print(f"\nTotal documents in workspace now: {len(docs)}")
    for d in docs:
        print(f" - {d['original_filename']} | Status: {d['status']} | Pages: {d['page_count']}")

if __name__ == "__main__":
    seed_synthetic_docs()
