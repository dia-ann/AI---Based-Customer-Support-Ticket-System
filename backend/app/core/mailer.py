"""Outbound email over Brevo SMTP (stdlib smtplib — no extra dependency).

Brevo (ex-Sendinblue) SMTP relay:
    host  smtp-relay.brevo.com
    port  587 (STARTTLS)  |  465 (implicit TLS)
    user  your Brevo SMTP login (looks like 8xxxxx@smtp-brevo.com)
    pass  your Brevo SMTP *key* (NOT the API v3 key, NOT your account password)

MAIL_FROM must be a verified sender in Brevo, otherwise the relay rejects
the message with 550.
"""
from __future__ import annotations

import logging
import smtplib
import ssl
from email.message import EmailMessage
from email.utils import formataddr, make_msgid

from backend.app.config import settings

logger = logging.getLogger(__name__)


class MailNotConfiguredError(RuntimeError):
    """Raised when SMTP credentials are missing."""


def _client() -> smtplib.SMTP | smtplib.SMTP_SSL:
    if not settings.BREVO_SMTP_LOGIN or not settings.BREVO_SMTP_KEY:
        raise MailNotConfiguredError(
            "BREVO_SMTP_LOGIN / BREVO_SMTP_KEY are not set in .env"
        )
    host, port = settings.BREVO_SMTP_HOST, settings.BREVO_SMTP_PORT
    context = ssl.create_default_context()
    if port == 465:
        smtp: smtplib.SMTP | smtplib.SMTP_SSL = smtplib.SMTP_SSL(
            host, port, timeout=settings.SMTP_TIMEOUT_SECONDS, context=context
        )
    else:
        smtp = smtplib.SMTP(host, port, timeout=settings.SMTP_TIMEOUT_SECONDS)
        smtp.ehlo()
        smtp.starttls(context=context)
        smtp.ehlo()
    smtp.login(settings.BREVO_SMTP_LOGIN, settings.BREVO_SMTP_KEY)
    return smtp


def send_email(to: str, subject: str, text_body: str, html_body: str | None = None) -> None:
    """Blocking. Call from FastAPI via run_in_threadpool(...)."""
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = formataddr((settings.MAIL_FROM_NAME, settings.MAIL_FROM))
    msg["To"] = to
    msg["Message-ID"] = make_msgid(domain=settings.MAIL_FROM.split("@")[-1])
    if settings.MAIL_REPLY_TO:
        msg["Reply-To"] = settings.MAIL_REPLY_TO
    msg.set_content(text_body)
    if html_body:
        msg.add_alternative(html_body, subtype="html")

    with _client() as smtp:
        smtp.send_message(msg)
    logger.info("Invitation email sent to %s", to)


def send_agent_invite_email(
    *,
    to: str,
    temporary_password: str,
    department_name: str,
    login_url: str | None = None,
) -> None:
    login_url = login_url or f"{settings.FRONTEND_URL.rstrip('/')}/login"
    subject = f"Your {settings.APP_NAME} agent account"

    text_body = f"""You have been added to {settings.APP_NAME} as a support agent.

Login email:        {to}
Temporary password: {temporary_password}
Department:         {department_name}
Login URL:          {login_url}

You will be asked to set your own password the first time you sign in.
Do not share this email — the temporary password is single-use in practice
and stops working once you change it.
"""

    html_body = f"""\
<!doctype html>
<html><body style="margin:0;padding:24px;background:#0a0c10;font-family:Segoe UI,Arial,sans-serif;color:#e5e7eb">
  <div style="max-width:520px;margin:0 auto;background:#11131a;border:1px solid #232632;border-radius:12px;padding:28px">
    <h1 style="margin:0 0 4px;font-size:18px;color:#ffffff">Welcome to {settings.APP_NAME}</h1>
    <p style="margin:0 0 20px;font-size:13px;color:#9ca3af">
      An administrator created a support agent account for you.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:13px;border-collapse:collapse">
      <tr>
        <td style="padding:8px 0;color:#9ca3af;width:150px">Login email</td>
        <td style="padding:8px 0;color:#ffffff"><strong>{to}</strong></td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#9ca3af">Temporary password</td>
        <td style="padding:8px 0"><code style="background:#0a0c10;border:1px solid #232632;border-radius:6px;padding:4px 8px;color:#fbbf24;font-size:14px">{temporary_password}</code></td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#9ca3af">Department</td>
        <td style="padding:8px 0;color:#ffffff">{department_name}</td>
      </tr>
    </table>
    <p style="margin:24px 0 0">
      <a href="{login_url}" style="display:inline-block;background:#fbbf24;color:#000000;text-decoration:none;font-weight:600;font-size:13px;padding:11px 20px;border-radius:8px">Sign in</a>
    </p>
    <p style="margin:20px 0 0;font-size:12px;color:#6b7280">
      You will be asked to choose your own password on first sign-in.
      If you did not expect this email, ignore it and tell your administrator.
    </p>
  </div>
</body></html>
"""
    send_email(to=to, subject=subject, text_body=text_body, html_body=html_body)