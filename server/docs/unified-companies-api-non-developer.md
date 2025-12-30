# Partner Integration Guide - Custom Calculator API

Welcome! This guide explains how your company can integrate its own pricing calculator with our platform.

---

## What This Means for You

Instead of using our default pricing calculator, you can **connect your own pricing system** to our platform. This means:

- ✅ **Your prices, your rules** - Use your own pricing formulas
- ✅ **Real-time quotes** - Prices come directly from your system
- ✅ **Always up-to-date** - Change your prices anytime, no coordination needed
- ✅ **Your competitive advantage** - Differentiate yourself from other companies

---

## How It Works (Simple Version)

```
Customer searches for shipping quote
         ↓
Our platform asks YOUR system: "How much to ship this car?"
         ↓
Your system responds with price
         ↓
Customer sees your quote alongside others
```

---

## What We Need From You

### 1. An API Endpoint

You provide us a URL where we can send pricing requests:

```
Example: https://yourcompany.com/api/calculate-shipping
```

### 2. Your Request Format

Tell us what fields your API expects. For example:

| What we have | What you call it |
|--------------|------------------|
| City name (origin) | `pickup_location` |
| Port name (destination) | `delivery_port` |
| Vehicle type | `car_category` |
| Auction name | `source` |

### 3. Your Response Format

Tell us where in your response we can find the price. For example:

```json
{
  "status": "ok",
  "quote": {
    "total_price": 2150.00,
    "currency": "USD"
  }
}
```

We need to know: *"The price is at `quote.total_price`"*

### 4. Authentication (if required)

If your API requires an API key or other authentication, provide us:

- Header name (e.g., `X-API-Key`)
- Header value (e.g., `your-secret-key-here`)

---

## Example Conversation

**You:** "Our API is at `https://acme-shipping.com/v2/price-check`"

**You:** "We expect these fields:"
- `origin` - the city name
- `dest` - the port name
- `vehicle` - the vehicle type
- `value` - the vehicle price

**You:** "Our response looks like:"
```json
{
  "pricing": {
    "shipping_cost": 1850,
    "estimated_days": 14
  }
}
```

**You:** "You need to send header `Authorization: Bearer abc123xyz`"

**Us:** "Got it! We'll configure your company to use your API."

---

## What We'll Do

Once you provide the information above, we will:

1. **Configure your company** in our system
2. **Map the fields** so our system can talk to yours
3. **Test the integration** to make sure it works
4. **Enable it** for all customers

From that point on, whenever a customer requests a quote and your company is active, we'll ask your API for the price in real-time.

---

## Technical Requirements

Your API must:

| Requirement | Details |
|-------------|---------|
| **Accept POST requests** | We send data via HTTP POST |
| **Accept JSON** | Request body is JSON format |
| **Return JSON** | Response must be valid JSON |
| **Return a price** | We need at least a numerical price value |
| **Be available** | Should have 99%+ uptime |
| **Respond quickly** | Under 30 seconds (ideally under 5) |

### Nice to Have (but not required)

- Distance information
- Currency code
- Breakdown of costs
- Delivery time estimate

---

## Frequently Asked Questions

### Q: Do I need to change my existing API?

**A:** Usually not! We can adapt to your existing format. Just tell us what you already have.

---

### Q: What if my API is down?

**A:** Your company will temporarily be excluded from quotes. Other companies will still show. When your API recovers, you'll automatically be included again.

---

### Q: Can I use different prices for different routes?

**A:** Yes! Your API receives the full route details (origin city, destination port, vehicle type). You can calculate any price you want based on this information.

---

### Q: How often will you call my API?

**A:** Every time a customer requests a quote for a route they haven't searched recently. We cache results for 24 hours to reduce load on your system.

---

### Q: Is my API key secure?

**A:** Yes. Your API key is stored encrypted in our database and is only used server-to-server. It's never exposed to customers or in browser code.

---

### Q: Can I see the requests you're sending?

**A:** Yes! We can provide sample requests during testing, and you can log the requests on your end to see exactly what we send.

---

### Q: What data do you send about customers?

**A:** We only send shipping quote parameters:
- Origin city/location
- Destination port
- Vehicle type
- Auction source
- Vehicle price (optional)

We do **NOT** send any customer personal information.

---

## Getting Started

Ready to integrate? Here's what to do:

### Step 1: Gather Your Information

Prepare the following:
- [ ] Your API endpoint URL
- [ ] Authentication details (if any)
- [ ] Example request/response from your API
- [ ] Contact for technical questions

### Step 2: Contact Us

Send us an email with:
- Subject: "Custom Calculator Integration"
- Your company name
- API documentation or examples

### Step 3: Testing

We'll set up a test configuration and verify:
- We can reach your API
- Field mapping is correct
- Prices are coming through correctly

### Step 4: Go Live

Once testing is successful, we enable your custom calculator for all customers!

---

## Contact

For integration questions, contact:
- **Email:** [your-integration-email@company.com]
- **Response time:** Within 1-2 business days

---

## Summary

| Step | What Happens |
|------|--------------|
| 1 | You provide API details |
| 2 | We configure field mapping |
| 3 | We test the integration |
| 4 | Your prices go live |

**Result:** Customers see YOUR prices, calculated by YOUR system, in real-time.

---

*Thank you for partnering with us!*
