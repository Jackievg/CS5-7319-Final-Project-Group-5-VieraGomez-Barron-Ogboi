import pika
import json
from shared.config import Config

class EventPublisher:
    def __init__(self):
        rmq_url = Config.RABBITMQ_URL
        if not rmq_url.startswith('amqp://'):
            rmq_url = f'amqp://{rmq_url}'
            
        params = pika.URLParameters(rmq_url)
        self.connection = pika.BlockingConnection(params)
        self.channel = self.connection.channel()
        self.channel.exchange_declare(
            exchange='task_events',
            exchange_type='fanout',
            durable=True
        )

    def publish(self, event_type, data):
        try:
            self.channel.basic_publish(
                exchange='task_events',
                routing_key='',
                body=json.dumps({'type': event_type, 'data': data}),
                properties=pika.BasicProperties(
                    delivery_mode=2  # make message persistent
                )
            )
        except Exception as e:
            print(f"Publishing error: {str(e)}")
            self.reconnect()

    def reconnect(self):
        self.connection.close()
        self.__init__()

    def __del__(self):
        self.connection.close()