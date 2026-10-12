import pytest
from fastapi.testclient import TestClient


def test_auth_workflow_and_data_isolation(unauthed_client: TestClient):
    client = unauthed_client

    # 1. Register User A
    user_a_data = {
        "full_name": "Alice Security",
        "email": "alice@example.com",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "terms_accepted": True
    }
    res_a = client.post("/api/auth/register", json=user_a_data)
    assert res_a.status_code == 201, res_a.text
    auth_a = res_a.json()
    token_a = auth_a["token"]
    user_a_id = auth_a["user"]["id"]
    assert auth_a["user"]["email"] == "alice@example.com"
    assert "password_hash" not in auth_a["user"]


    # 2. Duplicate registration with same email should be safely rejected
    res_dup = client.post("/api/auth/register", json=user_a_data)
    assert res_dup.status_code == 400
    assert "already exists" in res_dup.json()["detail"].lower()


    # 3. Register User B
    user_b_data = {
        "full_name": "Bob Analyst",
        "email": "bob@example.com",
        "password": "Password456!",
        "confirm_password": "Password456!",
        "terms_accepted": True
    }
    res_b = client.post("/api/auth/register", json=user_b_data)
    assert res_b.status_code == 201
    auth_b = res_b.json()
    token_b = auth_b["token"]
    user_b_id = auth_b["user"]["id"]
    assert user_b_id != user_a_id

    # 4. User A logs in
    login_a = client.post("/api/auth/login", json={
        "email": "alice@example.com",
        "password": "Password123!"
    })
    assert login_a.status_code == 200
    token_a_logged = login_a.json()["token"]

    # 5. Invalid credentials rejection
    login_fail = client.post("/api/auth/login", json={
        "email": "alice@example.com",
        "password": "WrongPassword!"
    })
    assert login_fail.status_code == 401

    # 6. Unauthenticated requests to protected endpoints should receive 401
    client.cookies.clear()
    res_unauth = client.get("/api/scans")
    assert res_unauth.status_code == 401

    res_unauth_me = client.get("/api/auth/me")
    assert res_unauth_me.status_code == 401


    # 7. User A creates a scan
    headers_a = {"Authorization": f"Bearer {token_a_logged}"}
    create_scan_a = client.post("/api/scans", json={
        "target": "https://example.com",
        "profile": "quick",
        "permission_confirmed": True
    }, headers=headers_a)
    assert create_scan_a.status_code == 201
    scan_a = create_scan_a.json()
    scan_a_id = scan_a["id"]
    assert scan_a["target"].rstrip('/') == "https://example.com"



    # 8. User A can see the scan in their scan list
    list_a = client.get("/api/scans", headers=headers_a)
    assert list_a.status_code == 200
    scans_a = list_a.json()
    assert len(scans_a) == 1
    assert scans_a[0]["id"] == scan_a_id

    # 9. User B listing scans gets an empty list (data isolation)
    headers_b = {"Authorization": f"Bearer {token_b}"}
    list_b = client.get("/api/scans", headers=headers_b)
    assert list_b.status_code == 200
    scans_b = list_b.json()
    assert len(scans_b) == 0

    # 10. User B attempting to view User A's scan by ID gets 404 (does not leak existence)
    view_scan_b = client.get(f"/api/scans/{scan_a_id}", headers=headers_b)
    assert view_scan_b.status_code == 404

    # 11. User B attempting to cancel or delete User A's scan gets 404
    cancel_b = client.post(f"/api/scans/{scan_a_id}/cancel", headers=headers_b)
    assert cancel_b.status_code == 404

    del_b = client.delete(f"/api/scans/{scan_a_id}", headers=headers_b)
    assert del_b.status_code == 404

    # 12. User B attempting to download User A's report gets 404
    rep_b = client.get(f"/api/reports/{scan_a_id}/json", headers=headers_b)
    assert rep_b.status_code == 404

    # 13. User A can access their own report
    rep_a = client.get(f"/api/reports/{scan_a_id}/json", headers=headers_a)
    assert rep_a.status_code == 200

    # 14. Analytics isolation: User B's overview should show 0 scans
    overview_b = client.get("/api/analytics/overview", headers=headers_b)
    assert overview_b.status_code == 200
    assert overview_b.json()["total_scans"] == 0

    overview_a = client.get("/api/analytics/overview", headers=headers_a)
    assert overview_a.status_code == 200
    assert overview_a.json()["total_scans"] == 1

    # 15. Password Change workflow
    pwd_change = client.post("/api/auth/change-password", json={
        "current_password": "Password123!",
        "new_password": "NewSecurePassword456!",
        "confirm_new_password": "NewSecurePassword456!"
    }, headers=headers_a)
    assert pwd_change.status_code == 200

    # Login with old password fails
    login_old = client.post("/api/auth/login", json={
        "email": "alice@example.com",
        "password": "Password123!"
    })
    assert login_old.status_code == 401

    # Login with new password succeeds
    login_new = client.post("/api/auth/login", json={
        "email": "alice@example.com",
        "password": "NewSecurePassword456!"
    })
    assert login_new.status_code == 200
    new_token_a = login_new.json()["token"]

    # 16. Forgot password / Reset password flow
    forgot = client.post("/api/auth/forgot-password", json={
        "email": "bob@example.com"
    })
    assert forgot.status_code == 200

    dev_token = forgot.json().get("dev_token")
    assert dev_token is not None

    reset = client.post("/api/auth/reset-password", json={
        "token": dev_token,
        "new_password": "BobNewPassword789!",
        "confirm_new_password": "BobNewPassword789!"
    })
    assert reset.status_code == 200

    # Bob logs in with reset password
    bob_login = client.post("/api/auth/login", json={
        "email": "bob@example.com",
        "password": "BobNewPassword789!"
    })
    assert bob_login.status_code == 200
