class Constants:
    SLOW_RATE_LIMIT = "3/minute"
    MEDIUM_RATE_LIMIT = "20/minute"
    GENEROUS_RATE_LIMIT = "40/minute"
    DEFAULT_TEMPERATURE = 0.7
    DEFAULT_MAX_TOKENS_LARGE = 1500
    DEFAULT_MAX_TOKENS_SMALL = 500
    PAYMENT_PLANS = {
        "free": {
            "name": "Free Tier",
            "price": 0,
            "word_limit": 1500,
            "features": ["Basic style analysis", "Limited generations"]
        },
        "basic": {
            "name": "Basic Tier",
            "price": 5,
            "word_limit": 6000,
            "features": ["More generations", "Priority support"]
        },
        "premium": {
            "name": "Premium Tier",
            "price": 20,
            "word_limit": 50000,
            "features": ["Comprehensive style analysis", "Priority support", "Credits do not expire"]
        }
    }


constants = Constants()
