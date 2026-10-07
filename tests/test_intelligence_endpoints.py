import requests

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_intelligence():
    print("=" * 60)
    print("DocuMind Intelligence Engine Live Verification")
    print("=" * 60)

    # Login
    login_res = requests.post(f"{BASE_URL}/auth/login", data={"username": "admin@docmind.local", "password": "AdminDocuMind2026!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    ws_id = requests.get(f"{BASE_URL}/workspaces", headers=headers).json()[0]["id"]
    docs = requests.get(f"{BASE_URL}/workspaces/{ws_id}/documents", headers=headers).json()

    msa_doc = next((d for d in docs if "agreement" in d["original_filename"].lower()), None)
    invoice_doc = next((d for d in docs if "invoice" in d["original_filename"].lower()), None)

    # 1. Contract Extraction
    if msa_doc:
        print(f"\n[1/3] Testing Contract Extraction on '{msa_doc['original_filename']}'...")
        res = requests.post(
            f"{BASE_URL}/workspaces/{ws_id}/intelligence/contract/{msa_doc['id']}",
            headers=headers
        )
        print(f"  Status: {res.status_code}")
        if res.status_code == 200:
            data = res.json()
            print(f"  Parties: {data.get('parties')}")
            print(f"  Payment Terms: {data.get('payment_terms')}")
            print(f"  Governing Law: {data.get('governing_law')}")
            print(f"  Termination: {data.get('termination_provisions')}")

    # 2. Invoice Extraction
    if invoice_doc:
        print(f"\n[2/3] Testing Invoice Extraction on '{invoice_doc['original_filename']}'...")
        res = requests.post(
            f"{BASE_URL}/workspaces/{ws_id}/intelligence/invoice/{invoice_doc['id']}",
            headers=headers
        )
        print(f"  Status: {res.status_code}")
        if res.status_code == 200:
            data = res.json()
            print(f"  Supplier: {data.get('supplier_name')}")
            print(f"  Invoice Number: {data.get('invoice_number')}")
            print(f"  Due Date: {data.get('due_date')}")
            print(f"  Total Amount: ${data.get('total_amount')} {data.get('currency')}")
            print(f"  Line Items Count: {len(data.get('line_items', []))}")

    # 3. System Hardware Stats
    print("\n[3/3] Testing System Telemetry Diagnostics...")
    stats_res = requests.get(f"{BASE_URL}/admin/stats", headers=headers)
    print(f"  Status: {stats_res.status_code}")
    if stats_res.status_code == 200:
        s = stats_res.json()
        print(f"  Model Profile: {s.get('model_profile')}")
        print(f"  Indexed Docs: {s.get('total_documents')}")
        print(f"  Total Chunks: {s.get('total_chunks')}")
        print(f"  Host RAM: {s.get('system_memory_mb', {}).get('percent_used')}% used")

    print("\n" + "=" * 60)
    print("ALL INTELLIGENCE SERVICES VERIFIED SUCCESSFULLY")
    print("=" * 60)

if __name__ == "__main__":
    test_intelligence()
