import os
from dotenv import load_dotenv

load_dotenv()

GATEWAY_URL = os.getenv("GATEWAY_URL", "https://your-gateway-url.com")

API_KEYS: dict[str, str] = {
    "APIM4OMINI": os.getenv("APIM4OMINI", ""),
    "APIM4OMINIPIIMASKINGREGEX": os.getenv("APIM4OMINIPIIMASKINGREGEX", ""),
    "APIM4OMINIURLGUARDRAIL": os.getenv("APIM4OMINIURLGUARDRAIL", ""),
    "APIM4OMINIWORDCOUNTGUARDRAIL": os.getenv("APIM4OMINIWORDCOUNTGUARDRAIL", ""),
}
