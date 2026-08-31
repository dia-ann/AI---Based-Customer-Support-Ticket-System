from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)
assert client.get('/health').status_code == 200
assert client.post('/api/tickets/classify', json={'subject': '   ', 'body': 'body'}).status_code == 422
assert client.post('/api/tickets/classify', json={'subject': 'Billing issue', 'body': 'Please contact me at test@example.com'}).status_code in (200, 503)
print('smoke_ok')
