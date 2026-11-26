"""Recorre registro, permisos y pujas en una instancia local de demo recién creada."""

import argparse
import json
import re
from http import HTTPStatus
from urllib.error import HTTPError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
from uuid import uuid4

DEMO_PASSWORD = "Demo-AuctionPro-2026"


def request(url, *, token=None, body=None, method="GET", expected=HTTPStatus.OK):
    headers = {"Accept": "application/json"}
    if token is not None:
        headers["Authorization"] = f"Bearer {token}"
    data = None
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode()
    try:
        with urlopen(Request(url, data, headers, method=method), timeout=10) as response:
            status, content = response.status, response.read()
    except HTTPError as error:
        status, content = error.code, error.read()
    if status != expected:
        raise AssertionError(
            f"{method} {urlsplit(url).path}: se esperaba HTTP {expected}, llegó {status}"
        )
    return json.loads(content) if content else None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--web", default="http://localhost:18081")
    parser.add_argument("--mail", default="http://localhost:18025")
    args = parser.parse_args()
    web = args.web.rstrip("/")
    mail = args.mail.rstrip("/")

    def api(path, **kwargs):
        return request(web + "/api" + path, **kwargs)

    def login(email, password=DEMO_PASSWORD):
        return api("/auth/login", method="POST", body={"email": email, "password": password})

    auction = next(row for row in api("/auctions") if row["location"] == "Sala de demostración")
    path = f"/auctions/{auction['id']}"
    first, second = api(path + "/catalog")
    assert all(lot["auctioned"] == "no" for lot in (first, second)), "Usá una demo recién creada."

    rematador = login("rematador@auctionpro.test")
    comprador = login("comprador@auctionpro.test")
    admin, buyer = rematador["token"], comprador["token"]
    assert rematador["administrator"] and not comprador["administrator"]
    api("/admin/clients/pending", expected=HTTPStatus.UNAUTHORIZED)
    api("/admin/clients/pending", token=buyer, expected=HTTPStatus.FORBIDDEN)
    api("/auctions", token="sesion-no-valida")
    api("/users/profile", token="sesion-no-valida", expected=HTTPStatus.UNAUTHORIZED)

    email = f"prueba-{uuid4().hex[:12]}@example.test"
    api("/auth/register", method="POST", expected=HTTPStatus.CREATED, body={
        "nombre": "Cuenta", "apellido": "de prueba", "document": uuid4().hex[:16], "email": email,
    })
    pending = api("/admin/clients/pending", token=admin)
    client_id = next(client["clientId"] for client in pending if client["email"] == email)
    api(f"/admin/clients/{client_id}/approve", method="POST", token=admin)
    messages = request(mail + "/api/v1/messages")["messages"]
    message_id = next(message["ID"] for message in messages if any(to["Address"] == email for to in message["To"]))
    activation = request(f"{mail}/api/v1/message/{message_id}")["Text"]
    activation_token = re.search(r"/set-password\?token=([\w-]+)", activation).group(1)
    credentials = {"token": activation_token, "password": DEMO_PASSWORD}
    session = api("/auth/set-password", method="POST", body=credentials)["token"]
    api("/auth/set-password", method="POST", body=credentials, expected=HTTPStatus.CONFLICT)
    api("/payment-methods", method="POST", token=session, expected=HTTPStatus.CREATED, body={
        "tipo": "CHEQUE_CERTIFICADO", "montoGarantizado": 100, "moneda": "ARS",
    })
    payments = api("/admin/payment-methods/pending", token=admin)
    method_id = next(row["method"]["id"] for row in payments if row["email"] == email)
    assert api(f"/admin/payment-methods/{method_id}/verify", token=admin, method="POST")["verificado"]

    check = next(row for row in api("/payment-methods", token=buyer) if row["tipo"] == "CHEQUE_CERTIFICADO")
    joined = api(path + "/join", token=buyer, method="POST", body={"paymentMethodId": check["id"]})
    assert joined["chequeDisponible"] == 120
    bid = api(path + "/bid", token=buyer, method="POST", body={"itemId": first["id"], "amount": 10})
    assert bid["amount"] == 10
    assert api(path + "/state", token=buyer)["chequeDisponible"] == 110
    close = f"{path}/items/{first['id']}/close"
    api(close, token=buyer, method="POST", expected=HTTPStatus.FORBIDDEN)
    result = api(close, token=admin, method="POST")
    assert result["sold"] and result["commission"] == 1 and result["nextItemId"] == second["id"]
    api(close, token=admin, method="POST", expected=HTTPStatus.CONFLICT)
    assert api(path + "/state", token=buyer)["chequeDisponible"] == 110
    assert any(note["type"] == "AUCTION_WON" for note in api("/notifications/mine", token=buyer))
    print("OK: alta, activación de un solo uso, permisos, verificación, puja y adjudicación.")


if __name__ == "__main__":
    main()
