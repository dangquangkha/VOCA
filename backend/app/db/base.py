# Import tất cả các models vào đây
from backend.app.db.base_class import Base
from backend.app.models.user import User
from backend.app.models.assessment import Assessment, Question, UserAssessmentResult
from backend.app.models.expert import ExpertProfile, ExpertAvailability
from backend.app.models.booking import Booking
from backend.app.models.payment import PaymentTransaction
from backend.app.models.ai_service import CVAnalysis, MockInterview
from backend.app.models.chat import Message
from backend.app.models.roadmap import DailyProgress
from backend.app.models.review import Review
from backend.app.models.notification import Notification