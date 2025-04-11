import pika
import json
from shared.config import Config

class EventPublisher:
    def __init__(self):
        self.connection = pika.BlockingConnection(
            pika.ConnectionParameters(Config.RABBITMQ_URL.split('amqp://')[1]))
        self.channel = self.connection.channel()
        self.channel.exchange_declare(
            exchange='task_events',
            exchange_type='fanout'
        )

    def publish(self, event_type, data):
        self.channel.basic_publish(
            exchange='task_events',
            routing_key='',
            body=json.dumps({'type': event_type, 'data': data})
        )