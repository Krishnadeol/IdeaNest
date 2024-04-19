require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);
const authRouter = require('./routes/auth.route')
const connectDB = require('./database/database')


const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

connectDB()

const storeItems = new Map([
    [1, {priceInCents: 10000, name: "Weekly Subscription to unlimited ideas"}],
    [2, {priceInCents: 20000, name: "Monthly Subscription to unlimited ideas"}],
    [3, {priceInCents: 30000, name: "Annual Subscription to unlimited ideas"}]
]);

app.use('/auth',authRouter)

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.post('/paymenthandler', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: req.body.items.map((item) =>  {
                const storeItem = storeItems.get(item.id);
                if (!storeItem) { // Check if storeItem is undefined
                    throw new Error(`Item with ID ${item.id} not found in storeItems.`);
                }
                return {
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: storeItem.name
                        },
                        unit_amount: storeItem.priceInCents
                    },
                    quantity: item.quantity
                };
            }),
            success_url: `${process.env.SERVER_URL}/success`,
            cancel_url: `${process.env.SERVER_URL}/ejdf`
        });

        res.json({ url: session.url });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
