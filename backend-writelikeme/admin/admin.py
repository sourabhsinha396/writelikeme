from sqladmin import Admin, ModelView
from database.models import User, AnonymousUser, StyleProfile, Sample, Generation, Consumption, PaymentAttempt, PaymentHistory


class UserAdmin(ModelView, model=User):
    column_list = [User.id, User.email, User.created_at]
    can_delete = False
    can_edit = True
    can_create = True
    can_view_details = True


class AnonymousUserAdmin(ModelView, model=AnonymousUser):
    column_list = [AnonymousUser.id, AnonymousUser.session_id, AnonymousUser.ip_address, AnonymousUser.created_at]
    can_delete = False
    can_edit = True
    can_create = True
    can_view_details = True


class StyleProfileAdmin(ModelView, model=StyleProfile):
    column_list = [StyleProfile.id, StyleProfile.name, StyleProfile.created_at, StyleProfile.updated_at]
    can_delete = False
    can_edit = True
    can_create = True
    can_view_details = True 


class SampleAdmin(ModelView, model=Sample):
    column_list = [Sample.id, Sample.title, Sample.created_at]
    can_delete = False
    can_edit = True
    can_create = True
    can_view_details = True 


class GenerationAdmin(ModelView, model=Generation):
    column_list = [Generation.id, Generation.title, Generation.created_at]
    can_delete = False
    can_edit = True 


class ConsumptionAdmin(ModelView, model=Consumption):
    column_list = [Consumption.id, Consumption.user_id, Consumption.plan_id, Consumption.word_limit, Consumption.words_used, Consumption.purchase_date, Consumption.last_usage_date]
    can_delete = False
    can_edit = True 


class PaymentAttemptAdmin(ModelView, model=PaymentAttempt):
    column_list = [PaymentAttempt.id, PaymentAttempt.user_id, PaymentAttempt.payment_id, PaymentAttempt.plan_id, PaymentAttempt.amount, PaymentAttempt.status, PaymentAttempt.created_at, PaymentAttempt.completed_at, PaymentAttempt.error_message]
    can_delete = False
    can_edit = True 
    
    
class PaymentHistoryAdmin(ModelView, model=PaymentHistory):
    column_list = [PaymentHistory.id, PaymentHistory.user_id, PaymentHistory.payment_attempt_id, PaymentHistory.payment_id, PaymentHistory.amount, PaymentHistory.status, PaymentHistory.plan_id, PaymentHistory.created_at, PaymentHistory.completed_at]
    can_delete = False
    can_edit = True 

