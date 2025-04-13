import sys
import os
import pika
import json
from pathlib import Path

# path configure

# Get absolute path to project root 
current_dir = Path(__file__).parent
project_root = current_dir.parent.parent  # Adjust if needed
sys.path.insert(0, str(project_root))

# imports
try:
    from event_driven_app.shared.models import db, PTORequest, Task, CompanyEvent
    from event_driven_app.shared.config import Config
    from event_driven_app.app.services.notification_service import send_notification
except ImportError as e:
    print(f"FATAL: Import failed! Check paths. Error: {e}")
    print(f"Python path: {sys.path}")
    print(f"Current dir: {os.getcwd()}")
    sys.exit(1)

# Event handeling
def handle_event(event_type, data):
    """Process different event types"""
    try:
        with db.session.begin():
            if event_type == 'TASK_CREATED':
                task = Task.query.get(data['task_id'])
                if task:
                    send_notification(
                        user_id=task.user_id,
                        message=f"New task created: {task.title}"
                    )
                    
            elif event_type == 'PTO_APPROVED':
                pto = PTORequest.query.get(data['pto_id'])
                if pto:
                    pto.status = 'approved'
                    db.session.commit()
                    send_notification(
                        user_id=pto.user_id,
                        message="Your PTO was approved!"
                    )
                    
            elif event_type == 'COMPANY_EVENT_CREATED':
                send_notification(
                    user_id=data.get('creator_id'),
                    message=f"New event: {data.get('title')}"
                )
                
    except Exception as e:
        print(f"Error handling {event_type}: {str(e)}")

# RABBITMQ Sub
def start_subscriber():
    try:
        # get host from config (handles amqp://host:port)
        rmq_host = Config.RABBITMQ_URL.split('amqp://')[1].split(':')[0]
        
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(
                host=rmq_host,
                heartbeat=600,
                blocked_connection_timeout=300
            )
        )
        channel = connection.channel()
        
        # Declare exchange
        channel.exchange_declare(
            exchange='task_events',
            exchange_type='fanout',
            durable=True
        )
        
        # Temporary exclusive queue
        result = channel.queue_declare(queue='', exclusive=True)
        queue_name = result.method.queue
        channel.queue_bind(exchange='task_events', queue=queue_name)
        
        def callback(ch, method, properties, body):
            try:
                event = json.loads(body)
                print(f" [x] Received {event['type']}")
                handle_event(event['type'], event['data'])
            except json.JSONDecodeError:
                print(" [!] Invalid JSON received")
            except KeyError as e:
                print(f" [!] Missing key in event: {str(e)}")
            except Exception as e:
                print(f" [!] Event processing failed: {str(e)}")
        
        print(" [*] Waiting for events. CTRL+C to exit")
        channel.basic_consume(
            queue=queue_name,
            on_message_callback=callback,
            auto_ack=True
        )
        channel.start_consuming()
        
    except pika.exceptions.AMQPConnectionError:
        print(" [x] Failed to connect to RabbitMQ. Is it running?")
        sys.exit(1)
    except KeyboardInterrupt:
        print(" [x] Gracefully shutting down...")
        connection.close()
        sys.exit(0)

# main execution
if __name__ == '__main__':
    try:
        from event_driven_app.app import create_app
        app = create_app()
        with app.app_context():
            start_subscriber()
    except Exception as e:
        print(f"FATAL: {str(e)}")
        sys.exit(1)