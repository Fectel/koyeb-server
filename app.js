const express = require('express')
const cors = require("cors");

const bodyParser = require('body-parser');
const fs = require('fs');
const { Server } = require("socket.io");
const https = require('https');
const app = express()
const port = process.env.PORT || 8000
const http = require('http').Server(app) 
const io = require('socket.io')(http) 
const stripe = require('stripe')("sk_test_tR1lCdhSwpvNA0iYNSE5lDY000PKNJL8Ys")

// const server = https.createServer(
//   {
//   key: fs.readFileSync('./key.pem'),
//   cert: fs.readFileSync('./cert.pem')
//   }
//   ,app
// )
//   ,  io = new Server(server, {
//     cors: {
//       origin: ["https://piehost.com",
//         "https://mariachichingon.com"
//       ]
//     }
//   })

app.use((req, res, next) => {
  if (req.originalUrl === '/webhook' ) {
      next()
  }else {
      bodyParser.json()(req, res, next);
      // bodyParser.urlencoded({extended: true})(req, res, next);
  }
})
app.use((req, res, next) => {
if (req.originalUrl === '/webhook') {
    next()
}else {
    bodyParser.urlencoded({ extended: true })(req, res, next);
    // bodyParser.urlencoded({extended: true})(req, res, next);
}
})

app.use(cors());

app.use(express.static('static'))
// app.get("/", (req, res) => {
//   res.send("Hello World");
// });
http.listen(port)

let transactionAmountInCents;
let invoice_pdf;
let invoice_number;
// const endpointSecret = "whsec_pJqGUEzEdLxovcQW0MAT6Impj5Q0pUDS";
const endpointSecret = "whsec_sMVll0GkTzvuTo0q9MzFCXcj7UL6ZU5i";

app.post('/webhook', express.raw({type: 'application/json'}), (request, response) => {

  invoice_pdf = "";
  invoice_number= 0;
  transactionAmountInCents = 0;
  console.log("Inside webhook!!!!");
  // console.log("req.rwaBody" , request.rawBody)
  // console.log("req.body", request.body);

  io.emit('message', "Webhook Received") 


  let event;

  try {
      event = stripe.webhooks.constructEvent(request.body, request.headers['stripe-signature'], endpointSecret);
  } catch (err) {
      console.log(`Webhook Error: ${err.message}`);
      return;
  }

  let  checkoutSessionAsyncPaymentSucceeded;
  // Handle the event
  switch (event.type) {
          case 'invoice.payment_succeeded':
           checkoutSessionAsyncPaymentSucceeded = event.data.object;
          console.log('invoice.payment.succeeded')
          transactionAmountInCents = checkoutSessionAsyncPaymentSucceeded.amount_paid
          // hosted_invoice_url = checkoutSessionAsyncPaymentSucceeded.hosted_invoice_url
          invoice_pdf = checkoutSessionAsyncPaymentSucceeded.invoice_pdf
          // invoice_pdf = checkoutSessionAsyncPaymentSucceeded.hosted_invoice_url
          invoice_number = checkoutSessionAsyncPaymentSucceeded.id
          io.emit('message', {invoice_pdf, invoice_number, transactionAmountInCents, contractSignatureUrl, contractImgUrl})
          io.emit('message', `invoice_pdf: ${invoice_pdf}
            invoice_number: ${invoice_number} 
            transactionAmountInCents: ${transactionAmountInCents}
            contractSignatureUrl: ${contractSignatureUrl}
            contractImgUrl: ${contractImgUrl}`
            )

          break;

      default:
     console.log(`Unhandled event type ${event.type}`);
  }

});


