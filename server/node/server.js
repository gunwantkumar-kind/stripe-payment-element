const express = require('express');
const app = express();
const { resolve } = require('path');
// Replace if using a different env file or config
require('dotenv').config({ path: '../.env' });

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.use(express.static(process.env.STATIC_DIR));
app.use(
  express.json()
);

app.get('/', (req, res) => {
  const path = resolve(process.env.STATIC_DIR + '/index.html');
  res.sendFile(path);
});

app.get('/config', (req, res) => {
  res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

app.post('/create-payment-intent', async (req, res) => {

  // Create a PaymentIntent with the amount, currency, and a payment method type.
  //
  // See the documentation [0] for the full list of supported parameters.
  //
  // [0] https://stripe.com/docs/api/payment_intents/create
  try {
    /**
     * We check email in our database if exists we'll use this customer id otherwise create a new customer and will use customer id
     */
    const customer = await stripe.customers.create({ name: req.body.name, email: req.body.email })
    const paymentIntent = await stripe.paymentIntents.create({
      customer: customer.id,
      currency: req.body.currency,
      amount: req.body.amount,
      automatic_payment_methods: { enabled: true }
    });
    // Send publishable key and PaymentIntent details to client
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (e) {
    return res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
});


app.post('/create-session', async (req, res) => {
  try {
    /**
     * We check email in our database if exists we'll use this customer id otherwise create a new customer and will use customer id
     */
    const customer = await stripe.customers.create({ name: req.body.name, email: req.body.email })
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      success_url: 'http://localhost:4242/return.html',
      line_items: [
        {
          price: req.body.price,
          quantity: req.body.quantity,
        },
      ],
      mode: 'payment',
      ui_mode: 'custom',
    });

    res.send({
      sessionId: session.id,
    });
  } catch (e) {
    return res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
})
app.listen(4242, () =>
  console.log(`Node server listening at http://localhost:4242`)
);
