# Import tất cả các models vào đây
from backend.app.db.base_class import Base
from backend.app.domains.identity.models import User
from backend.app.models.assessment import Assessment, Question, UserAssessmentResult
from backend.app.domains.marketplace.models import ExpertProfile, ExpertAvailability, ExpertQuiz, BookingQuizResponse, PublicQuizResponse
from backend.app.domains.booking.models import Booking, BookingDispute
from backend.app.domains.payments.models import PaymentTransaction
from backend.app.models.ai_service import CVAnalysis, MockInterview
from backend.app.models.chat import Message
from backend.app.models.roadmap import DailyProgress, RoadmapHistory
from backend.app.models.review import Review
from backend.app.models.notification import Notification
from backend.app.models.email_log import EmailLog
from backend.app.domains.mbti.models import MBTIQuestion, MBTIType, UserMBTIResult