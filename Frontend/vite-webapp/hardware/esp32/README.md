# ESP32 sensor contract

`POST {BACKEND_URL}/api/sensor/readings` with `Content-Type: application/json`:

```json
{"device_id":"esp32-khadki-01","village_id":"v-khadki","temperature":27.4,"ph":6.7,"tds":410,"turbidity":8.1,"timestamp":"2026-08-22T09:30:00Z"}
```

All readings are optional except `device_id`, `village_id`, and `timestamp`; validate/calibrate sensor units at the backend. The citizen UI consumes only derived safety status and health score. Keep the device credential out of firmware repositories (provision it at install time).
