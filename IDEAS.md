# Potential Extensions for noti-service

## Customer-facing features

1. **Order Status Tracking** - Add a `/status` endpoint that lets customers check their order status via SMS (e.g., "Reply with your order number")
2. **Two-way Messaging** - Allow customers to ask questions via SMS and route to staff
3. **Appointment Booking** - Add pickup/delivery scheduling via SMS

## Operational efficiency

4. **Order Management API** - CRUD endpoints for orders (create, read, update, delete) stored in Firestore
5. **Batch Upload** - CSV import for sending bulk notifications
6. **Delivery Notifications** - Add delivery status SMS when orders are out for delivery

## Analytics & reporting

7. **Dashboard Endpoints** - Metrics on messages sent, delivery rates, opt-outs
8. **Daily/Weekly Reports** - Auto-email summaries of orders processed, reminders sent

## Customer retention

9. **Loyalty Program** - Track customer visits and send special offers
10. **Re-engagement Campaigns** - Auto-notify lapsed customers after X days
11. **Birthday/Anniversary Messages** - Send personalized discounts

## Technical improvements

12. **Retry Logic** - Failed SMS retries with exponential backoff
13. **Message Templates** - Admin-configurable SMS templates via environment/db
14. **Rate Limiting** - Prevent abuse of the API
15. **Logging/Monitoring** - Structured logging with error alerting