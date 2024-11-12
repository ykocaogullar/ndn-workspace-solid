import { createSignal } from 'solid-js'
import styles from './styles.module.scss'
import { createInvitationPackage, invitationPackage } from '../../backend/main'
import { Encoder } from '@ndn/tlv'
import { bytesToBase64 } from '../../utils'

const KeyEntry = () => {
  const [privateKey, setPrivateKey] = createSignal('')
  const [publicKey, setPublicKey] = createSignal('')
  const [email, setEmail] = createSignal('')
  const [certificateDisplay, setCertificateDisplay] = createSignal('')
  const [copySuccess, setCopySuccess] = createSignal('')

  const isButtonEnabled = () => privateKey().trim() !== '' && publicKey().trim() !== '' && email().trim() !== ''

  const handleSubmit = async () => {
    try {
      createInvitationPackage()

      if (invitationPackage) {
        await invitationPackage.setKeysFromStrings(privateKey(), publicKey(), email())
        console.log('Keys successfully set in InvitationPackage')

        // Generate the self-signed certificate
        const selfSignedCert = await invitationPackage.generatePersonalCertificate()

        // Encode the certificate in base64
        const encodedCert = bytesToBase64(Encoder.encode(selfSignedCert.data))

        // Display the certificate as base64
        setCertificateDisplay(encodedCert)
      } else {
        console.error('Failed to create invitationPackage.')
      }
    } catch (error) {
      console.error('Error setting keys or generating certificate:', error)
      setCertificateDisplay('Failed to generate certificate. Check console for details.')
    }
  }

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(certificateDisplay())
      setCopySuccess('Copied to clipboard!')
      setTimeout(() => setCopySuccess(''), 2000)
    } catch (error) {
      setCopySuccess('Failed to copy')
    }
  }

  return (
    <div class={styles.keyEntryPage}>
      <h1 class={styles.pageTitle}>Enter Your Personal Keys</h1>
      <div class={styles.formContainer}>
        <label class={styles.label}>Email</label>
        <input
          type="text"
          class={styles.inputField}
          value={email()}
          onInput={(e) => setEmail(e.currentTarget.value)}
          placeholder="Enter your email"
        />

        <label class={styles.label}>Private Key</label>
        <input
          type="text"
          class={styles.inputField}
          value={privateKey()}
          onInput={(e) => setPrivateKey(e.currentTarget.value)}
          placeholder="Enter your private key"
        />

        <label class={styles.label}>Public Key</label>
        <input
          type="text"
          class={styles.inputField}
          value={publicKey()}
          onInput={(e) => setPublicKey(e.currentTarget.value)}
          placeholder="Enter your public key"
        />

        <button class={styles.submitButton} disabled={!isButtonEnabled()} onClick={handleSubmit}>
          Submit
        </button>

        {certificateDisplay() && (
          <div class={styles.certificateDisplayContainer}>
            <h3>Generated Self-Signed Certificate (Base64 Encoded)</h3>
            <textarea class={styles.certificateDisplay} value={certificateDisplay()} readOnly rows="10" />
            <button class={styles.copyButton} onClick={handleCopyToClipboard}>
              Copy
            </button>
            {copySuccess() && <p class={styles.copySuccess}>{copySuccess()}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

export default KeyEntry
