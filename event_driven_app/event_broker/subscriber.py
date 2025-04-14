import sys
import os
import pika
import json
import time
from pathlib import Path
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker

# Set up proper Python path
current_dir = Path(__file__).parent
project_root = current_dir.parent.parent
sys.path.insert(0, str(project_root))

# Import shared modules
try:
    from event_driven_app.shared.config import Config
    from event_driven_app.shared.models import db, Task, PTORequest, CompanyEvent, User
except ImportError as e:
    print(f"Critical import error: {str(e)}")
    sys.exit(1)

# Initialize DB connection independent of Flask
engine = create_engine(Config.SQLALCHEMY_DATABASE_URI)
db.session = scoped_session(sessionmaker(bind=engine))

def send_notification(user_id, message):
    """Simulate notification sending"""
    try:
        user = db.session.query(User).get(user_id)
        if user:
            print(f"\n[NOTIFICATION to {user.username}] {message}\n")
        else:
            print(f"\n[NOTIFICATION FAILED] User {user_id} not found\n")
    except Exception as e:
        print(f"Notification error: {str(e)}")

def handle_event(event_type, data):
    """Process all event types with proper error handling"""
    try:
        if event_type == 'TASK_CREATED':
            task = db.session.query(Task).get(data['task_id'])
            if task:
                send_notification(
                    user_id=task.user_id,
                    message=f"New task created: {task.title}"
                )
                
        elif event_type == 'TASK_COMPLETED':
            task = db.session.query(Task).get(data['task_id'])
            if task:
                task.completed = True
                task.updated_at = datetime.utcnow()
                db.session.commit()
                send_notification(
                    user_id=task.user_id,
                    message=f"Task completed: {task.title}"
                )
                
        elif event_type == 'PTO_REQUESTED':
            pto = db.session.query(PTORequest).get(data['pto_id'])
            if pto:
                manager = db.session.query(User).filter_by(is_manager=True).first()
                if manager:
                    send_notification(
                        user_id=manager.id,
                        message=f"New PTO request from {pto.requester.username}"
                    )
                    
        elif event_type == 'PTO_APPROVED':
            pto = db.session.query(PTORequest).get(data['pto_id'])
            if pto:
                pto.status = 'approved'
                pto.approver_id = data.get('approver_id')
                pto.updated_at = datetime.utcnow()
                db.session.commit()
                send_notification(
                    user_id=pto.user_id,
                    message="Your PTO request was approved!"
                )
                
        elif event_type == 'PTO_REJECTED':
            pto = db.session.query(PTORequest).get(data['pto_id'])
            if pto:
                pto.status = 'rejected'
                pto.approver_id = data.get('approver_id')
                pto.updated_at = datetime.utcnow()
                db.session.commit()
                send_notification(
                    user_id=pto.user_id,
                    message="Your PTO request was rejected"
                )
                
        elif event_type == 'COMPANY_EVENT_CREATED':
            users = db.session.query(User).all()
            for user in users:
                send_notification(
                    user_id=user.id,
                    message=f"New company event: {data.get('title', 'New Event')}"
                )
                
        elif event_type == 'TASK_SHARED':
            task = db.session.query(Task).get(data['task_id'])
            shared_with = db.session.query(User).get(data['shared_with_id'])
            if task and shared_with:
                send_notification(
                    user_id=shared_with.id,
                    message=f"Task shared with you: {task.title}"
                )
                
        else:
            print(f"Unknown event type: {event_type}")
            
    except Exception as e:
        print(f"Error handling {event_type}: {str(e)}")
        db.session.rollback()

def start_subscriber():
    """RabbitMQ consumer with robust connection handling"""
    while True:
        try:
            # Parse RabbitMQ URL
            rmq_url = Config.RABBITMQ_URL
            if not rmq_url.startswith('amqp://'):
                rmq_url = f'amqp://{rmq_url}'
            
            params = pika.URLParameters(rmq_url)
            connection = pika.BlockingConnection(params)
            channel = connection.channel()
            
            # Set up exchange
            channel.exchange_declare(
                exchange='task_events',
                exchange_type='fanout',
                durable=True
            )
            
            # Set up queue
            result = channel.queue_declare(
                queue='task_events_queue',
                durable=True
            )
            queue_name = result.method.queue
            channel.queue_bind(
                exchange='task_events',
                queue=queue_name
            )
            
            print("\n=== Event Subscriber Started ===")
            print(f"Connected to RabbitMQ at {Config.RABBITMQ_URL}")
            print("Listening for events...")
            print("Press CTRL+C to exit\n")
            
            def callback(ch, method, properties, body):
                try:
                    event = json.loads(body)
                    print(f"\n[EVENT RECEIVED] {event['type']}")
                    handle_event(event['type'], event['data'])
                except json.JSONDecodeError:
                    print("[ERROR] Invalid JSON received")
                except KeyError as e:
                    print(f"[ERROR] Missing key in event: {str(e)}")
                except Exception as e:
                    print(f"[ERROR] Event processing failed: {str(e)}")
            
            channel.basic_consume(
                queue=queue_name,
                on_message_callback=callback,
                auto_ack=True
            )
            
            channel.start_consuming()
            
        except pika.exceptions.AMQPConnectionError:
            print("[ERROR] RabbitMQ connection failed. Retrying in 5 seconds...")
            time.sleep(5)
        except KeyboardInterrupt:
            print("\nGracefully shutting down...")
            try:
                if 'connection' in locals():
                    connection.close()
            except:
                pass
            break
        except Exception as e:
            print(f"[ERROR] Unexpected error: {str(e)}")
            time.sleep(5)

if __name__ == '__main__':
    start_subscriber()