FROM tiangolo/meinheld-gunicorn-flask:python3.9
COPY ./app /app
RUN pip install -r /app/requirements.txt
