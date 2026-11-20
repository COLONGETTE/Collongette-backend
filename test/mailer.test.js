import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createResendMailer } from '../src/mailer.js'

test('Resend mailer sends the request to the API with Reply-To', async () => {
  const originalFetch = globalThis.fetch
  let request
  globalThis.fetch = async (url, options) => {
    request = { url, options }
    return new Response(JSON.stringify({ id: 'email-id' }), { status: 200 })
  }

  try {
    const mailer = createResendMailer('resend-test-key')
    await mailer.sendMail({
      from: 'Site <site@example.com>',
      to: 'owner@example.com',
      replyTo: 'guest@example.com',
      subject: 'Demande de contact',
      html: '<p>Bonjour</p>',
      text: 'Bonjour',
    })

    assert.equal(request.url, 'https://api.resend.com/emails')
    assert.equal(request.options.method, 'POST')
    assert.equal(request.options.headers.Authorization, 'Bearer resend-test-key')
    assert.deepEqual(JSON.parse(request.options.body), {
      from: 'Site <site@example.com>',
      to: 'owner@example.com',
      reply_to: 'guest@example.com',
      subject: 'Demande de contact',
      html: '<p>Bonjour</p>',
      text: 'Bonjour',
    })
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('Resend mailer surfaces unsuccessful API responses', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response('Invalid API key', { status: 401 })

  try {
    const mailer = createResendMailer('invalid-key')
    await assert.rejects(
      mailer.sendMail({
        from: 'Site <site@example.com>',
        to: 'owner@example.com',
        replyTo: 'guest@example.com',
        subject: 'Demande',
        html: '<p>Bonjour</p>',
        text: 'Bonjour',
      }),
      /Resend 401 Invalid API key/,
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})
