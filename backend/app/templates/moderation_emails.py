"""Email templates for account moderation notifications"""

def get_suspension_email(user_name: str, reason: str) -> tuple[str, str]:
    """Email template for account suspension"""
    subject = "Your CareerPath Account Has Been Suspended"
    
    body = f"""
Dear {user_name},

Your CareerPath account has been temporarily suspended.

Reason: {reason}

What this means:
• Your profile is hidden from search results
• You cannot receive new bookings
• Your wallet balance is frozen
• All pending appointments have been cancelled and refunded to students

If you believe this is a mistake or would like to appeal this decision, please contact us at admin@careerpath.com with your account details and explanation.

Best regards,
CareerPath Team
    """
    
    return subject, body.strip()


def get_unsuspension_email(user_name: str) -> tuple[str, str]:
    """Email template for account restoration"""
    subject = "Your CareerPath Account Has Been Restored"
    
    body = f"""
Dear {user_name},

Good news! Your CareerPath account has been restored to active status.

You can now:
• Accept new bookings
• Your profile is visible in search results
• Access your wallet and withdraw funds
• Provide consultations to students

Thank you for your cooperation.

Best regards,
CareerPath Team
    """
    
    return subject, body.strip()


def get_ban_email(user_name: str, reason: str) -> tuple[str, str]:
    """Email template for account ban"""
    subject = "Your CareerPath Account Has Been Permanently Banned"
    
    body = f"""
Dear {user_name},

Your CareerPath account has been permanently disabled.

Reason: {reason}

This action is permanent and means:
• You can no longer access the CareerPath platform
• All pending appointments have been cancelled
• You cannot create a new account with this email address

If you believe this is an error, please contact support@careerpath.com within 14 days with evidence to support your appeal.

Best regards,
CareerPath Team
    """
    
    return subject, body.strip()


def get_unban_email(user_name: str) -> tuple[str, str]:
    """Email template for account unban"""
    subject = "Your CareerPath Account Has Been Restored"
    
    body = f"""
Dear {user_name},

Your CareerPath account ban has been lifted and your account has been restored.

You can now log in and use all platform features normally. Please ensure you follow our Community Standards to avoid future issues.

Welcome back!

Best regards,
CareerPath Team
    """
    
    return subject, body.strip()
