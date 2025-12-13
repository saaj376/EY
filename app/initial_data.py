import logging
from app.core.database import engine, Base
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.ueba import UEBAEvent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully.")

if __name__ == "__main__":
    init_db()
