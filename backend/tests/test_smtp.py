import smtplib
from email.mime.text import MIMEText
import os
from dotenv import load_dotenv

load_dotenv()

def test_smtp():
    sender_email = os.getenv("MAIL_USERNAME")
    sender_password = os.getenv("MAIL_PASSWORD")
    to_email = sender_email # Send to self for testing

    print(f"Sender: {sender_email}")
    # Print first and last characters of password for verification (securely)
    if sender_password and len(sender_password) > 2:
        print(f"Password starts with: {sender_password[0]}... and ends with: ...{sender_password[-1]}")
        print(f"Password length: {len(sender_password)}")
    else:
        print("Password is empty or too short.")

    try:
        msg = MIMEText("This is a test email from DermaAI authentication debugger.")
        msg['Subject'] = "SMTP Test"
        msg['From'] = sender_email
        msg['To'] = to_email

        print("Connecting to smtp.gmail.com:465...")
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            print("Connected. Logging in...")
            server.login(sender_email, sender_password)
            print("Logged in. Sending email...")
            server.sendmail(sender_email, to_email, msg.as_string())
            print("Email sent successfully!")
            
    except Exception as e:
        print(f"FAILED: {type(e).__name__}: {e}")

if __name__ == "__main__":
    test_smtp()
