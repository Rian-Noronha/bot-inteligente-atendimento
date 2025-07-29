from sqlalchemy import create_engine
from .settings import settings

engine = create_engine(settings.DATABASE_URL)

print("Engine do SQLAlchemy criado. A conexão será estabelecida sob demanda.")