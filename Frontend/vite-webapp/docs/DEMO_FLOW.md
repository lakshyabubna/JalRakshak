# SIH demo script (90 seconds)

1. Open **District Official**: Khadki is shown as high risk with a concise, human-safe explanation.
2. Open **Demo flow** and select **Simulate abnormal sensor reading**.
3. Explain the progression: ESP32 posts a reading → backend stores it → risk score changes → safe explanation/recommendation → alert preview → ASHA task.
4. Open **Village Public**: show only the score and clear boil-water guidance; raw sensor values are intentionally absent.
5. Open **ASHA Offline**: turn Offline Mode on, log fever/diarrhea, then turn it off and Sync Now.

The alert buttons are transparent simulators until a provider adapter is configured. Demo data is clearly labelled and replaces no real records.
