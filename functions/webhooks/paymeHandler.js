import { getFirestore } from 'firebase-admin/firestore';

const PAYME_KEY = process.env.PAYME_KEY;

/**
 * Handle Payme Payment Webhooks
 * Documentation: https://developer.help.paycom.uz/
 * Protocol: JSON-RPC 2.0
 */
export const handlePaymeWebhook = async (req, res) => {
  // Verify Basic Auth
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) {
    console.warn('Payme: Unauthorized request');
    return res.status(401).json({
      error: { code: -32504, message: 'Unauthorized' }
    });
  }

  const credentials = Buffer.from(auth.split(' ')[1], 'base64').toString();
  const [username, password] = credentials.split(':');

  if (username !== 'Paycom' || password !== PAYME_KEY) {
    console.warn('Payme: Invalid credentials');
    return res.status(401).json({
      error: { code: -32504, message: 'Invalid credentials' }
    });
  }

  const { method, params, id } = req.body;
  const db = getFirestore();

  console.log('Payme webhook:', { method, params });

  try {
    switch (method) {
      case 'CheckPerformTransaction': {
        const { account, amount } = params;
        const userId = account.user_id;
        const planId = account.plan_id;
        const amountInUSD = amount / 100; // Convert from tiyins

        console.log('Payme CheckPerformTransaction:', { userId, planId, amountInUSD });

        // Verify user exists
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
          return res.json({
            error: { code: -31050, message: { uz: 'Foydalanuvchi topilmadi', ru: 'Пользователь не найден', en: 'User not found' } },
            id
          });
        }

        // Verify amount
        const expectedAmount = planId === 'individual' ? 2.99 : amountInUSD;
        if (Math.abs(amountInUSD - expectedAmount) > 0.01) {
          return res.json({
            error: { code: -31001, message: { uz: 'Noto\'g\'ri summa', ru: 'Неверная сумма', en: 'Incorrect amount' } },
            id
          });
        }

        return res.json({ result: { allow: true }, id });
      }

      case 'CreateTransaction': {
        const { account, amount, time, id: txId } = params;
        const userId = account.user_id;
        const planId = account.plan_id;

        console.log('Payme CreateTransaction:', { txId, userId, planId });

        // Check if transaction already exists
        const existingTx = await db.collection('payme_transactions').doc(txId).get();
        if (existingTx.exists) {
          const txData = existingTx.data();
          return res.json({
            result: {
              create_time: txData.time,
              transaction: txId,
              state: txData.state
            },
            id
          });
        }

        // Create new transaction
        await db.collection('payme_transactions').doc(txId).set({
          userId,
          planId,
          amount,
          time,
          state: 1, // Created
          createdAt: new Date()
        });

        return res.json({
          result: {
            create_time: time,
            transaction: txId,
            state: 1
          },
          id
        });
      }

      case 'PerformTransaction': {
        const { id: txId } = params;

        console.log('Payme PerformTransaction:', { txId });

        const txDoc = await db.collection('payme_transactions').doc(txId).get();

        if (!txDoc.exists) {
          return res.json({
            error: { code: -31003, message: { uz: 'Tranzaksiya topilmadi', ru: 'Транзакция не найдена', en: 'Transaction not found' } },
            id
          });
        }

        const txData = txDoc.data();

        // If already performed, return existing data
        if (txData.state === 2) {
          return res.json({
            result: {
              transaction: txId,
              perform_time: txData.performedAt?.getTime() || Date.now(),
              state: 2
            },
            id
          });
        }

        // Update subscription
        const currentPeriodEnd = new Date();
        currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

        await db.collection('users').doc(txData.userId).update({
          'subscription.planId': txData.planId,
          'subscription.status': 'active',
          'subscription.currentPeriodEnd': currentPeriodEnd,
          'subscription.lastPayment': new Date(),
          'subscription.provider': 'payme'
        });

        // Mark transaction as performed
        const performTime = Date.now();
        await db.collection('payme_transactions').doc(txId).update({
          state: 2,
          performedAt: new Date(performTime)
        });

        // Log payment
        await db.collection('payment_logs').add({
          userId: txData.userId,
          planId: txData.planId,
          amount: txData.amount / 100,
          provider: 'payme',
          payme_transaction_id: txId,
          status: 'completed',
          completedAt: new Date()
        });

        console.log('Payme PerformTransaction success');

        return res.json({
          result: {
            transaction: txId,
            perform_time: performTime,
            state: 2
          },
          id
        });
      }

      case 'CancelTransaction': {
        const { id: txId, reason } = params;

        console.log('Payme CancelTransaction:', { txId, reason });

        const txDoc = await db.collection('payme_transactions').doc(txId).get();

        if (!txDoc.exists) {
          return res.json({
            error: { code: -31003, message: 'Transaction not found' },
            id
          });
        }

        const cancelTime = Date.now();
        await db.collection('payme_transactions').doc(txId).update({
          state: -1,
          cancelledAt: new Date(cancelTime),
          reason
        });

        return res.json({
          result: {
            transaction: txId,
            cancel_time: cancelTime,
            state: -1
          },
          id
        });
      }

      case 'CheckTransaction': {
        const { id: txId } = params;

        console.log('Payme CheckTransaction:', { txId });

        const txDoc = await db.collection('payme_transactions').doc(txId).get();

        if (!txDoc.exists) {
          return res.json({
            error: { code: -31003, message: 'Transaction not found' },
            id
          });
        }

        const txData = txDoc.data();
        return res.json({
          result: {
            create_time: txData.time,
            perform_time: txData.performedAt?.getTime() || 0,
            cancel_time: txData.cancelledAt?.getTime() || 0,
            transaction: txId,
            state: txData.state,
            reason: txData.reason || null
          },
          id
        });
      }

      case 'GetStatement': {
        const { from, to } = params;

        console.log('Payme GetStatement:', { from, to });

        const transactions = await db.collection('payme_transactions')
            .where('time', '>=', from)
            .where('time', '<=', to)
            .get();

        const txList = transactions.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            time: data.time,
            amount: data.amount,
            account: {
              user_id: data.userId,
              plan_id: data.planId
            },
            create_time: data.time,
            perform_time: data.performedAt?.getTime() || 0,
            cancel_time: data.cancelledAt?.getTime() || 0,
            transaction: doc.id,
            state: data.state,
            reason: data.reason || null
          };
        });

        return res.json({
          result: {
            transactions: txList
          },
          id
        });
      }

      default:
        console.warn('Payme: Unknown method:', method);
        return res.json({
          error: { code: -32601, message: 'Method not found' },
          id
        });
    }
  } catch (error) {
    console.error('Payme webhook error:', error);
    return res.json({
      error: { code: -32400, message: 'Internal error' },
      id
    });
  }
};
