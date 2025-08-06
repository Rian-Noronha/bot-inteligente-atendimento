import logging
import sys

LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

def setup_logging(level=logging.INFO):
    """Configura o sistema de logging."""
    logging.basicConfig(
        level=level,
        format=LOG_FORMAT,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    print("Sistema de logging configurado.")