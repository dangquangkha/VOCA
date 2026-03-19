"""Export account actions to CSV format"""
import csv
import io
from typing import List
from backend.app.models.account_action import AccountAction


def export_actions_to_csv(actions: List[AccountAction]) -> str:
    """
    Export account actions to CSV format.
    
    Args:
        actions: List of AccountAction objects
        
    Returns:
        CSV string
    """
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "ID",
        "Timestamp",
        "Action Type",
        "Target User ID",
        "Target Email",
        "Admin ID",
        "Admin Email",
        "Reason",
        "Notes"
    ])
    
    # Write data rows
    for action in actions:
        writer.writerow([
            action.id,
            action.created_at.isoformat(),
            action.action_type.value,
            action.target_user_id,
            action.target_user.email if action.target_user else "N/A",
            action.admin_id,
            action.admin.email if action.admin else "N/A",
            action.reason,
            action.notes or ""
        ])
    
    return output.getvalue()
