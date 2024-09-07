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
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY)

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
//end point please work
// const endpointSecret = "whsec_pJqGUEzEdLxovcQW0MAT6Impj5Q0pUDS";
const endpointSecret = "whsec_ZXTu5EU99KNO9kGmgBZYL64CaubnHZ6s";

app.post('/webhook', express.raw({type: 'application/json'}), (request, response) => {

  invoice_pdf = "";
  invoice_number= 0;
  transactionAmountInCents = 0;
  console.log("Inside webhook!!!!");
  io.emit('message', "Webhook Received") 


  let event;

  try {
    io.emit('message', "before stripe constructEvent") 

      event = stripe.webhooks.constructEvent(request.body, request.headers['stripe-signature'], endpointSecret);

    } catch (err) {
        io.emit('message', `Webhook Error ${err.message} `) 

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
          io.emit('message',`Inside switch statement/`)
          io.emit('message', `invoice_pdf: ${invoice_pdf}`)
          io.emit('invoice_pdf', `${invoice_pdf}`)
          io.emit('message', `invoice_number: ${invoice_number}`)
          io.emit('invoice_number', `${invoice_number}`)
          io.emit('message', `transactionAmountInCents: ${transactionAmountInCents}`)
          io.emit('contractSignatureUrl', `${contractSignatureUrl}`)
          io.emit('contractImgUrl', `${contractImgUrl}`)

        

          break;

      default:
     console.log(`Unhandled event type ${event.type}`);
  }

});

let contractSignatureUrl;
let contractImgUrl;

app.post("/pay-mariachi-deposit",async(req, res) => {
    // console.log(req.query)
    const arr = [req.query]

    contractImgUrl ="";
    contractSignatureUrl = "";
    contractImgUrl = req.query.contractImgUrl;
    contractSignatureUrl = req.query.contractSignatureUrl;

    // console.log(arr,)
        try {
            const session = await stripe.checkout.sessions.
            create({
                payment_method_types: ["card"],
                mode: "payment",
                invoice_creation: {
                    enabled: true,
                },
                line_items: arr.map(( order, i) => {
                    // console.log(order,i ,"order")
                    return {
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: order.name
                            },
                            unit_amount: order.price * 100,
                        },
                        quantity: 1
                    }
                }),

                success_url: `${process.env.CLIENT_URL}/success-paying-deposit/${req.query.contractId}/${req.query.clientId}`,
                // success_url:   success_url: `${process.env.CLIENT_URL}/success-paying-deposit/`,
                cancel_url:  `${process.env.CLIENT_URL}/failure-paying-deposit/${req.query.contractId}/${req.query.clientId}`,

        })

            // console.log(session, "< seesion <")
            // console.log(process.env.CLIENT_URL, "<clientURl",session.url, "<Seesion.url")

            res.json({url: session.url})
        }catch (e) {
            res.status(500).json({error: e.message})
        }
    })

app.post('/pay-mariachi-remaining-balance', async (req, res) => {
        console.log(req.query)
        const arr = [req.query]
    
        console.log(arr,)
        try {
            const session = await stripe.checkout.sessions.
            create({
                payment_method_types: ["card"],
                mode: "payment",
                invoice_creation: {
                    enabled: true,
                },
                line_items: arr.map(( order, i) => {
                    console.log(order,i ,"order")
                    return {
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: order.name
                            },
                            unit_amount: order.price * 100,
                        },
                        quantity: 1
                    }
                }),
    
                success_url: `${process.env.CLIENT_URL}/success-paying-remaining-balance/${req.query.contractId}/${req.query.clientId}`,
                // success_url: `${process.env.CLIENT_URL}/success-paying-order`,
                cancel_url: `${process.env.CLIENT_URL}/contract-page/${req.query.contractId}`,
            })
    
            console.log(session, "< seesion <")
            console.log(process.env.CLIENT_URL, "<clientURl",session.url, "<Seesion.url")
    
            res.json({url: session.url})
        }catch (e) {
            res.status(500).json({error: e.message})
        }
    
    })
    

