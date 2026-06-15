import emails
from emails.template import JinjaTemplate
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.email_log import EmailLog
from backend.app.core.config import settings

async def send_email(
    to: str,
    subject: str,
    body: str,
    db: AsyncSession,
    html_body: str = None
) -> None:
    """
    Sends a real email using SMTP settings from config.
    Always logs the email to DB.
    """
    # 1. Create Log (Always log, even if sending fails or mock)
    email_log = EmailLog(
        to_email=to,
        subject=subject,
        body=body
    )
    db.add(email_log)
    await db.commit() 
    
    # 2. Check if Emails Enabled
    if not settings.EMAILS_ENABLED:
        print("="*60)
        print(f"MOCK EMAIL SENT TO: {to}")
        print(f"SUBJECT: {subject}")
        print("="*60)
        return

    # 2.5 Send via Resend REST API (HTTP) to bypass Render Free port block
    if settings.RESEND_KEY:
        import httpx
        resend_url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {settings.RESEND_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "from": f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>",
            "to": [to],
            "subject": subject,
            "text": body
        }
        if html_body:
            payload["html"] = html_body

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(resend_url, json=payload, headers=headers)
                if response.status_code in [200, 201, 250]:
                    print(f"Email sent successfully to {to} via Resend API")
                    return
                else:
                    print(f"ERROR Sending Email via Resend: {response.text}")
                    print("Attempting SMTP fallback...")
        except Exception as e:
            print(f"EXCEPTION Sending Email via Resend: {e}")
            print("Attempting SMTP fallback...")

    # 3. Send via SMTP
    message_kwargs = {
        "subject": subject,
        "text": body,
        "mail_from": (settings.EMAILS_FROM_NAME, settings.EMAILS_FROM_EMAIL)
    }
    if html_body:
        message_kwargs["html"] = html_body

    message = emails.Message(**message_kwargs)
    
    smtp_options = {
        "host": settings.SMTP_HOST,
        "port": settings.SMTP_PORT,
        "tls": True,
        "user": settings.SMTP_USER,
        "password": settings.SMTP_PASSWORD
    }
    
    # Send (synchronous call, might block event loop slightly but acceptable for low volume)
    # Ideally should offload to Celery/BackgroundTasks
    # Send via SMTP using threadpool to avoid blocking the event loop
    from starlette.concurrency import run_in_threadpool
    try:
        def _send():
            return message.send(to=to, smtp=smtp_options)
            
        response = await run_in_threadpool(_send)
        
        if response.status_code not in [250, 200]:
            print(f"ERROR Sending Email: {response.error}")
        else:
            print(f"Email sent successfully to {to}")
    except Exception as e:
        print(f"EXCEPTION Sending Email: {e}")
