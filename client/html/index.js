document.addEventListener('DOMContentLoaded', async () => {
  let body = {
    email: 'work.bhushankumar+pay@gmail.com',
    amount: 15000,
    currency: 'usd',
    coupon: 'NT-10',
    taxRates: [
      'txr_1Ml9aMGHf1WlTIAfuuLPCcKI'
    ]
  }
  
  // Load the publishable key from the server. The publishable key
  // is set in your .env file.
  const { publishableKey } = await fetch('/config').then((r) => r.json());
  if (!publishableKey) {
    addMessage(
      'No publishable key returned from the server. Please check `.env` and try again'
    );
    alert('Please set your Stripe publishable API key in the .env file');
  }

  const stripe = Stripe(publishableKey);

  // On page load, we create a PaymentIntent on the server so that we have its clientSecret to
  // initialize the instance of Elements below. The PaymentIntent settings configure which payment
  // method types to display in the PaymentElement.

  // addMessage(`Client secret returned.`);
  const options = {
    mode: 'payment',
    amount: body.amount,
    currency: body.currency,
    // Fully customizable with appearance API.
    appearance: {/*...*/ },
  };
  // Initialize Stripe Elements with the PaymentIntent's clientSecret,
  // then mount the payment element.
  // Set up Stripe.js and Elements to use in checkout form
  const elements = stripe.elements(options);

  // Create and mount the Payment Element
  const paymentElement = elements.create('payment');
  paymentElement.mount('#payment-element');


  // When the form is submitted...
  const form = document.getElementById('payment-form');
  let submitted = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Inside submit function');
    // Disable double submission of the form
    if (submitted) { return; }
    submitted = true;
    form.querySelector('button').disabled = true;

    // Trigger form validation and wallet collection
    const { error: submitError } = await elements.submit();
    if (submitError) {
      addMessage(submitError);
      // reenable the form.
      submitted = false;
      form.querySelector('button').disabled = false;
      return;
    }
    try {
      let response = await fetch('/create-payment-intent', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)

      }).then(r => r.json());

      console.log('response :>> ', response);
      // Confirm the payment given the clientSecret
      // from the payment intent that was just created on
      // the server.
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        clientSecret: response.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/return.html`,
        }
      });

      if (stripeError) {
        addMessage(stripeError.message);
        // reenable the form.
        submitted = false;
        form.querySelector('button').disabled = false;
        return;
      }

    } catch (backendError) {
      submitted = false;
      form.querySelector('button').disabled = false;
      addMessage(backendError.message);
    }
  });
});
