import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'crypto';

const CLICK_SECRET_KEY = process.env.CLICK_SECRET_KEY;

/**
 * Handle Click.uz Payment Webhooks
 * Documentation: https://docs.click.uz/en/click-api-request/
 */
export const handleClickWebhook = async (req, res) => {
  const {
    click_trans_id,
    service_id,
    merchant_trans_id, // Format: userId_planId
    amount,
    action, // 0 = Prepare, 1 = Complete
    sign_time,
    sign_string,
    merchant_prepare_id,
    error
  } = req.body;

  console.log('Click webhook received:', { action, merchant_trans_id, amount });

  // Verify signature
  const expectedSign = action === 0 ?
        crypto.createHash('md5').update(`${click_trans_id}${service_id}${CLICK_SECRET_KEY}${merchant_trans_id}${amount}${action}${sign_time}`).digest('hex') :
        crypto.createHash('md5').update(`${click_trans_id}${service_id}${CLICK_SECRET_KEY}${merchant_trans_id}${merchant_prepare_id}${amount}${action}${sign_time}`).digest('hex');

  if (expectedSign !== sign_string) {
    console.error('Click signature mismatch');
    return res.json({ error: -1, error_note: 'Invalid signature' });
  }

  const db = getFirestore();
  const [userId, planId] = merchant_trans_id.split('_');

  if (!userId || !planId) {
    return res.json({ error: -5, error_note: 'Invalid merchant_trans_id format' });
  }

  try {
    if (action === 0) {
      // PREPARE: Verify order
      console.log('Click PREPARE:', { userId, planId, amount });

      // Validate amount based on plan
      const expectedAmount = planId === 'individual' ? 2.99 : parseFloat(amount); // For family, calculate dynamically
      if (Math.abs(parseFloat(amount) - expectedAmount) > 0.01) {
        return res.json({ error: -2, error_note: 'Incorrect amount' });
      }

      // Check if user exists
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return res.json({ error: -5, error_note: 'User not found' });
      }

      // Create prepare record
      const prepareId = `${userId}_${Date.now()}`;
      await db.collection('payment_prepares').doc(prepareId).set({
        userId,
        planId,
        click_trans_id,
        amount,
        service_id,
        createdAt: new Date(),
        provider: 'click'
      });

      console.log('Click PREPARE success:', prepareId);

      return res.json({
        click_trans_id,
        merchant_trans_id,
        merchant_prepare_id: prepareId,
        error: 0,
        error_note: 'Success'
      });
    }

    if (action === 1) {
      // COMPLETE: Finalize payment
      console.log('Click COMPLETE:', { userId, planId, merchant_prepare_id });

      // Update subscription
      const userRef = db.collection('users').doc(userId);
      const currentPeriodEnd = new Date();
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

      await userRef.update({
        'subscription.planId': planId,
        'subscription.status': 'active',
        'subscription.currentPeriodEnd': currentPeriodEnd,
        'subscription.lastPayment': new Date(),
        'subscription.provider': 'click'
      });

      // Log successful payment
      await db.collection('payment_logs').add({
        userId,
        planId,
        amount: parseFloat(amount),
        provider: 'click',
        click_trans_id,
        merchant_prepare_id,
        status: 'completed',
        completedAt: new Date()
      });

      console.log('Click COMPLETE success');

      return res.json({
        click_trans_id,
        merchant_trans_id,
        merchant_confirm_id: merchant_prepare_id,
        error: 0,
        error_note: 'Success'
      });
    }

    return res.json({ error: -8, error_note: 'Invalid action' });
  } catch (error) {
    console.error('Click webhook error:', error);
    return res.json({ error: -9, error_note: 'Internal server error' });
  }
};
