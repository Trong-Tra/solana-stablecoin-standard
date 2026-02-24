import { Logger } from 'winston';

interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  retryCount: number;
  retryDelayMs: number;
}

interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  status: 'pending' | 'delivered' | 'failed';
  attempts: number;
  lastAttempt?: Date;
  error?: string;
}

export class WebhookService {
  private webhooks: Map<string, WebhookConfig> = new Map();
  private deliveries: Map<string, WebhookDelivery> = new Map();

  constructor(private logger: Logger) {}

  isHealthy(): boolean {
    return true;
  }

  /**
   * Register a new webhook
   */
  registerWebhook(config: Omit<WebhookConfig, 'id'>): WebhookConfig {
    const webhook: WebhookConfig = {
      ...config,
      id: this.generateId(),
    };

    this.webhooks.set(webhook.id, webhook);
    this.logger.info('Webhook registered', { 
      webhookId: webhook.id, 
      url: webhook.url,
      events: webhook.events 
    });

    return webhook;
  }

  /**
   * Update webhook
   */
  updateWebhook(
    webhookId: string,
    updates: Partial<WebhookConfig>
  ): WebhookConfig {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error(`Webhook not found: ${webhookId}`);
    }

    Object.assign(webhook, updates);
    this.webhooks.set(webhookId, webhook);

    this.logger.info('Webhook updated', { webhookId });
    return webhook;
  }

  /**
   * Delete webhook
   */
  deleteWebhook(webhookId: string): void {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error(`Webhook not found: ${webhookId}`);
    }

    this.webhooks.delete(webhookId);
    this.logger.info('Webhook deleted', { webhookId });
  }

  /**
   * Get webhook by ID
   */
  getWebhook(webhookId: string): WebhookConfig | undefined {
    return this.webhooks.get(webhookId);
  }

  /**
   * List all webhooks
   */
  listWebhooks(activeOnly: boolean = false): WebhookConfig[] {
    const webhooks = Array.from(this.webhooks.values());
    return activeOnly ? webhooks.filter(w => w.active) : webhooks;
  }

  /**
   * Trigger webhooks for an event
   */
  async triggerEvent(event: string, payload: any): Promise<void> {
    const webhooks = Array.from(this.webhooks.values())
      .filter(w => w.active && (w.events.includes('*') || w.events.includes(event)));

    for (const webhook of webhooks) {
      const delivery = this.createDelivery(webhook.id, event, payload);
      this.deliverWebhook(delivery, webhook);
    }
  }

  /**
   * Get delivery status
   */
  getDelivery(deliveryId: string): WebhookDelivery | undefined {
    return this.deliveries.get(deliveryId);
  }

  /**
   * Get deliveries for a webhook
   */
  getDeliveries(webhookId?: string, status?: string): WebhookDelivery[] {
    let deliveries = Array.from(this.deliveries.values());
    
    if (webhookId) {
      deliveries = deliveries.filter(d => d.webhookId === webhookId);
    }
    
    if (status) {
      deliveries = deliveries.filter(d => d.status === status);
    }
    
    return deliveries.sort((a, b) => 
      (b.lastAttempt?.getTime() || 0) - (a.lastAttempt?.getTime() || 0)
    );
  }

  private createDelivery(
    webhookId: string,
    event: string,
    payload: any
  ): WebhookDelivery {
    const delivery: WebhookDelivery = {
      id: this.generateId(),
      webhookId,
      event,
      payload,
      status: 'pending',
      attempts: 0,
    };

    this.deliveries.set(delivery.id, delivery);
    return delivery;
  }

  private async deliverWebhook(
    delivery: WebhookDelivery,
    webhook: WebhookConfig
  ): Promise<void> {
    const maxAttempts = webhook.retryCount + 1;
    
    while (delivery.attempts < maxAttempts && delivery.status !== 'delivered') {
      delivery.attempts++;
      delivery.lastAttempt = new Date();

      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-ID': webhook.id,
            'X-Event': delivery.event,
            'X-Attempt': delivery.attempts.toString(),
            ...(webhook.secret && { 
              'X-Signature': this.generateSignature(delivery.payload, webhook.secret) 
            }),
          },
          body: JSON.stringify({
            event: delivery.event,
            timestamp: new Date().toISOString(),
            data: delivery.payload,
          }),
        });

        if (response.ok) {
          delivery.status = 'delivered';
          this.logger.info('Webhook delivered', { 
            deliveryId: delivery.id,
            webhookId: webhook.id,
            event: delivery.event
          });
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error: any) {
        delivery.error = error.message;
        
        if (delivery.attempts >= maxAttempts) {
          delivery.status = 'failed';
          this.logger.error('Webhook delivery failed', { 
            deliveryId: delivery.id,
            webhookId: webhook.id,
            error: error.message,
            attempts: delivery.attempts
          });
        } else {
          this.logger.warn('Webhook delivery attempt failed, retrying', { 
            deliveryId: delivery.id,
            attempt: delivery.attempts,
            error: error.message
          });
          
          // Wait before retry
          await this.delay(webhook.retryDelayMs * delivery.attempts);
        }
      }
    }

    this.deliveries.set(delivery.id, delivery);
  }

  private generateSignature(payload: any, secret: string): string {
    // In production, use HMAC-SHA256
    // For now, return a placeholder
    return `sha256=${Buffer.from(JSON.stringify(payload) + secret).toString('base64')}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateId(): string {
    return `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
