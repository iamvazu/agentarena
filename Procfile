web: gunicorn -w 1 -k uvicorn.workers.UvicornWorker --chdir backend main:app
worker: celery -A worker worker --loglevel=info --workdir backend
