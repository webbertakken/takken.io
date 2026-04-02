import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import { Resend } from 'resend'
import { logger } from 'firebase-functions'

initializeApp()

const resendApiKey = defineSecret('RESEND_API_KEY')
const senderEmail = defineSecret('SENDER_EMAIL')

/** Triggers when a new pending subscriber is created. Sends a verification email via Resend. */
export const onPendingSubscriber = onDocumentCreated(
  {
    document: 'pending_subscribers/{docId}',
    region: 'europe-west1',
    secrets: [resendApiKey, senderEmail],
  },
  async (event) => {
    const snapshot = event.data
    if (!snapshot) {
      logger.warn('onPendingSubscriber: no data in event')
      return
    }

    const data = snapshot.data()
    const { email, token } = data as { email: string; token: string }

    if (!email || !token) {
      logger.error('onPendingSubscriber: missing email or token', { email, token })
      return
    }

    const resend = new Resend(resendApiKey.value())
    const from = senderEmail.value() || 'noreply@takken.io'
    const verifyUrl = `https://takken.io/courses?verify=${encodeURIComponent(token)}`

    logger.info('Sending verification email', { email, verifyUrl })

    const { error } = await resend.emails.send({
      from,
      to: email,
      subject: 'Confirm your subscription',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="margin-bottom: 16px;">Confirm your subscription</h2>
          <p>Click the link below to confirm your subscription to takken.io course updates:</p>
          <p style="margin: 24px 0;">
            <a href="${verifyUrl}"
               style="background: #111; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
              Confirm subscription
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            If you did not request this, you can safely ignore this email.
          </p>
        </div>
      `,
    })

    if (error) {
      logger.error('Failed to send verification email', { email, error })
      return
    }

    logger.info('Verification email sent successfully', { email })

    const db = getFirestore()
    await db.doc(`pending_subscribers/${event.params.docId}`).update({ emailSent: true })
  },
)

/** HTTP callable function to verify a subscription token. */
export const verifySubscription = onCall({ region: 'europe-west1' }, async (request) => {
  const { token } = request.data as { token?: string }

  if (!token || typeof token !== 'string') {
    throw new HttpsError('invalid-argument', 'A valid token is required.')
  }

  const db = getFirestore()
  const pendingQuery = await db
    .collection('pending_subscribers')
    .where('token', '==', token)
    .limit(1)
    .get()

  if (pendingQuery.empty) {
    logger.warn('verifySubscription: token not found', { token })
    throw new HttpsError('not-found', 'Verification token not found or already used.')
  }

  const pendingDoc = pendingQuery.docs[0]
  const { email, topics } = pendingDoc.data() as { email: string; topics: string[] }

  logger.info('Verifying subscription', { email, token })

  await db.doc(`subscribers/${email}`).set(
    {
      email,
      topics,
      subscribedAt: new Date(),
    },
    { merge: true },
  )

  await pendingDoc.ref.delete()

  logger.info('Subscription verified successfully', { email })

  return { success: true, email }
})
