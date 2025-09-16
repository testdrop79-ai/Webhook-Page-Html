// Webhook Management System JavaScript

class WebhookManager {
    constructor() {
        this.webhooks = [];
        this.selectedWebhook = null;
        this.init();
    }

    init() {
        this.loadWebhooks();
        this.bindEvents();
        this.renderWebhookList();
    }

    // Event binding
    bindEvents() {
        // Form submission
        document.getElementById('webhookForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveWebhook();
        });

        // Refresh library
        document.getElementById('refreshLibrary').addEventListener('click', () => {
            this.renderWebhookList();
            this.showMessage('Webhook library refreshed!', 'info');
        });

        // Webhook actions
        document.getElementById('editWebhook').addEventListener('click', () => {
            this.editSelectedWebhook();
        });

        document.getElementById('deleteWebhook').addEventListener('click', () => {
            this.deleteSelectedWebhook();
        });

        document.getElementById('testWebhook').addEventListener('click', () => {
            this.testSelectedWebhook();
        });
    }

    // Load webhooks from localStorage
    loadWebhooks() {
        const stored = localStorage.getItem('webhooks');
        if (stored) {
            this.webhooks = JSON.parse(stored);
        }
    }

    // Save webhooks to localStorage
    saveWebhooksToStorage() {
        localStorage.setItem('webhooks', JSON.stringify(this.webhooks));
    }

    // Save new webhook
    saveWebhook() {
        const form = document.getElementById('webhookForm');
        const formData = new FormData(form);
        
        const webhook = {
            id: Date.now().toString(),
            name: formData.get('webhookName').trim(),
            url: formData.get('webhookUrl').trim(),
            description: formData.get('webhookDescription').trim() || 'No description provided',
            created: new Date().toISOString(),
            lastTested: null,
            status: 'untested'
        };

        // Validation
        if (!webhook.name || !webhook.url) {
            this.showMessage('Please fill in all required fields!', 'error');
            return;
        }

        // Check for duplicate names
        if (this.webhooks.some(w => w.name.toLowerCase() === webhook.name.toLowerCase())) {
            this.showMessage('A webhook with this name already exists!', 'error');
            return;
        }

        // Add webhook
        this.webhooks.push(webhook);
        this.saveWebhooksToStorage();
        
        // Reset form
        form.reset();
        
        // Update UI
        this.renderWebhookList();
        this.showMessage(`Webhook "${webhook.name}" saved successfully!`, 'success');
    }

    // Render webhook list
    renderWebhookList() {
        const listContainer = document.getElementById('webhookList');
        const emptyMessage = document.getElementById('emptyLibrary');
        
        if (this.webhooks.length === 0) {
            listContainer.innerHTML = '';
            emptyMessage.style.display = 'block';
            return;
        }

        emptyMessage.style.display = 'none';
        
        listContainer.innerHTML = this.webhooks.map(webhook => `
            <div class="webhook-item" data-id="${webhook.id}">
                <h4>${this.escapeHtml(webhook.name)}</h4>
                <p><strong>URL:</strong> <span class="webhook-url">${this.escapeHtml(webhook.url)}</span></p>
                <p><strong>Description:</strong> ${this.escapeHtml(webhook.description)}</p>
                <p><strong>Created:</strong> ${new Date(webhook.created).toLocaleString()}</p>
                <p><strong>Status:</strong> <span class="status-${webhook.status}">${webhook.status}</span></p>
            </div>
        `).join('');

        // Add click handlers
        listContainer.querySelectorAll('.webhook-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectWebhook(item.dataset.id);
            });
        });
    }

    // Select webhook
    selectWebhook(webhookId) {
        // Remove previous selection
        document.querySelectorAll('.webhook-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Find and select webhook
        const webhook = this.webhooks.find(w => w.id === webhookId);
        if (!webhook) return;

        this.selectedWebhook = webhook;

        // Update UI
        document.querySelector(`[data-id="${webhookId}"]`).classList.add('selected');
        
        // Show webhook details
        const detailsContainer = document.getElementById('selectedWebhook');
        detailsContainer.style.display = 'block';
        
        document.getElementById('selectedName').textContent = webhook.name;
        document.getElementById('selectedUrl').textContent = webhook.url;
        document.getElementById('selectedDescription').textContent = webhook.description;
        document.getElementById('selectedDate').textContent = new Date(webhook.created).toLocaleString();

        this.showMessage(`Selected webhook: ${webhook.name}`, 'info');
    }

    // Edit selected webhook
    editSelectedWebhook() {
        if (!this.selectedWebhook) {
            this.showMessage('No webhook selected!', 'error');
            return;
        }

        // Fill form with selected webhook data
        document.getElementById('webhookName').value = this.selectedWebhook.name;
        document.getElementById('webhookUrl').value = this.selectedWebhook.url;
        document.getElementById('webhookDescription').value = this.selectedWebhook.description;

        // Remove the webhook from the list (it will be re-added when saved)
        this.webhooks = this.webhooks.filter(w => w.id !== this.selectedWebhook.id);
        this.saveWebhooksToStorage();
        
        // Update UI
        this.selectedWebhook = null;
        document.getElementById('selectedWebhook').style.display = 'none';
        this.renderWebhookList();
        
        this.showMessage('Webhook loaded for editing. Update the fields and click Save.', 'info');
        
        // Scroll to form
        document.querySelector('.create-webhook').scrollIntoView({ behavior: 'smooth' });
    }

    // Delete selected webhook
    deleteSelectedWebhook() {
        if (!this.selectedWebhook) {
            this.showMessage('No webhook selected!', 'error');
            return;
        }

        if (confirm(`Are you sure you want to delete the webhook "${this.selectedWebhook.name}"?`)) {
            const webhookName = this.selectedWebhook.name;
            
            // Remove from array
            this.webhooks = this.webhooks.filter(w => w.id !== this.selectedWebhook.id);
            this.saveWebhooksToStorage();
            
            // Update UI
            this.selectedWebhook = null;
            document.getElementById('selectedWebhook').style.display = 'none';
            this.renderWebhookList();
            
            this.showMessage(`Webhook "${webhookName}" deleted successfully!`, 'success');
        }
    }

    // Test selected webhook
    async testSelectedWebhook() {
        if (!this.selectedWebhook) {
            this.showMessage('No webhook selected!', 'error');
            return;
        }

        const testResultsSection = document.getElementById('testResults');
        const testOutput = document.getElementById('testOutput');
        
        testResultsSection.style.display = 'block';
        testOutput.textContent = 'Testing webhook...\n';

        try {
            // Create test payload
            const testPayload = {
                test: true,
                timestamp: new Date().toISOString(),
                message: 'This is a test webhook from Webhook Management System',
                webhook_name: this.selectedWebhook.name
            };

            testOutput.textContent += `Sending test payload to: ${this.selectedWebhook.url}\n`;
            testOutput.textContent += `Payload: ${JSON.stringify(testPayload, null, 2)}\n\n`;

            // Note: Due to CORS restrictions, we can't actually send the webhook in a browser
            // This is a simulation of what would happen
            testOutput.textContent += 'Note: This is a simulated test due to browser CORS restrictions.\n';
            testOutput.textContent += 'In a real implementation, this would:\n';
            testOutput.textContent += '1. Send a POST request to the webhook URL\n';
            testOutput.textContent += '2. Include the test payload as JSON\n';
            testOutput.textContent += '3. Report the response status and any errors\n\n';
            
            // Simulate response
            setTimeout(() => {
                testOutput.textContent += 'Simulated Response: 200 OK\n';
                testOutput.textContent += 'Test completed successfully!\n';
                
                // Update webhook status
                this.selectedWebhook.lastTested = new Date().toISOString();
                this.selectedWebhook.status = 'tested';
                this.saveWebhooksToStorage();
                this.renderWebhookList();
                this.selectWebhook(this.selectedWebhook.id);
                
                this.showMessage('Webhook test completed!', 'success');
            }, 1500);

        } catch (error) {
            testOutput.textContent += `Error: ${error.message}\n`;
            this.selectedWebhook.status = 'error';
            this.saveWebhooksToStorage();
            this.renderWebhookList();
            this.showMessage('Webhook test failed!', 'error');
        }
    }

    // Show message
    showMessage(text, type = 'info') {
        const messageContainer = document.getElementById('messageContainer');
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        
        messageContainer.appendChild(message);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 5000);
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WebhookManager();
});

// Add some sample data for demonstration (only if no webhooks exist)
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const stored = localStorage.getItem('webhooks');
        if (!stored || JSON.parse(stored).length === 0) {
            const sampleWebhooks = [
                {
                    id: 'sample1',
                    name: 'Discord Notification',
                    url: 'https://discord.com/api/webhooks/123456789/your-webhook-token',
                    description: 'Send notifications to Discord channel',
                    created: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                    lastTested: null,
                    status: 'untested'
                },
                {
                    id: 'sample2',
                    name: 'Slack Integration',
                    url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
                    description: 'Integration with Slack workspace',
                    created: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                    lastTested: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
                    status: 'tested'
                }
            ];
            
            localStorage.setItem('webhooks', JSON.stringify(sampleWebhooks));
            
            // Refresh the display
            if (window.webhookManager) {
                window.webhookManager.loadWebhooks();
                window.webhookManager.renderWebhookList();
            }
        }
    }, 1000);
});