import unittest

from app.risk import assess_water_risk


class WaterRiskTests(unittest.TestCase):
    def test_clean_water_is_safe(self):
        risk = assess_water_risk(2, 7.2, 0, 0)
        self.assertEqual(risk.level, "safe")

    def test_contamination_signal_is_high_or_emergency(self):
        risk = assess_water_risk(20, 9.5, 8, 75)
        self.assertIn(risk.level, {"high", "emergency"})
        self.assertGreaterEqual(risk.score, 50)


if __name__ == "__main__":
    unittest.main()
