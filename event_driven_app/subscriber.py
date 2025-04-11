import pika
import json
from shared.models import db, PTORequest, Task, CompanyEvent
from shared.config import Config
from app.services.notification_service import send_notification

def handle_event(event_type, data):
    with db.session.begin():
        if event_type == 'TASK_CREATED':
            task = Task.query.get(data['task_id'])
            send_notification(
                user_id=task.user_id,
                message=f"New task created: {task.title}"
            )
        elif event_type == 'PTO_APPROVED':
            pto = PTORequest.query.get(data['pto_id'])
            pto.status = 'approved'
            db.session.commit()
            send_notification(
                user_id=pto.user_id,
                message=f"Your PTO was approved!"
            )

def start_subscriber():
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(Config.RABBITMQ_URL.split('amqp://')[1]))
    channel = connection.channel()
    channel.exchange_declare(exchange='task_events', exchange_type='fanout')
    
    result = channel.queue_declare(queue='', exclusive=True)
    queue_name = result.method.queue
    channel.queue_bind(exchange='task_events', queue=queue_name)
    
    def callback(ch, method, properties, body):
        event = json.loads(body)
        handle_event(event['type'], event['data'])
    
    channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)
    print(" [*] Waiting for events. To exit press CTRL+C")
    channel.start_consuming()

if __name__ == '__main__':
    from app import create_app
    app = create_app()
    with app.app_context():
        start_subscriber()