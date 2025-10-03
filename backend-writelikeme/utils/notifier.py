import os
import requests


def send_slack_notification(message: str):
    url = os.getenv("SLACK_WEBHOOK_URL")
    data = {
        "text": message
    }
    response = requests.post(url, json=data)
    if response.status_code != 200:
        print(f"Failed to send Slack notification: {response.status_code} {response.text}") 
        
