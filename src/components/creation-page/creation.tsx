import { createSignal } from 'solid-js'
import styles from './styles.module.scss'
import { invitationPackage } from '../../backend/main'
import { Encoder } from '@ndn/tlv'
import { bytesToBase64 } from '../../utils'

const WorkspaceCreationPage = () => {
  const [workspaceName, setWorkspaceName] = createSignal('')
  const [x509Certificate, setX509Certificate] = createSignal('')
  const [x509PrivateKey, setX509PrivateKey] = createSignal('')
  const [domainName, setDomainName] = createSignal('')
  const [certificateDisplay, setCertificateDisplay] = createSignal('')
  const [copySuccess, setCopySuccess] = createSignal('')
  const [isInitiator, setIsInitiator] = createSignal(true)

  const isButtonEnabled = () =>
    workspaceName().trim() && x509Certificate().trim() && x509PrivateKey().trim() && domainName().trim()

  const handleSubmit = async () => {
    try {
      if (invitationPackage) {
        // Generate the workspace certificate
        const workspaceCert = await invitationPackage.generateWorkspaceCertificate(
          domainName(),
          workspaceName(),
          x509PrivateKey(),
          x509Certificate(),
        )

        // Encode the certificate to Base64
        const certBase64 = bytesToBase64(Encoder.encode(workspaceCert.data))
        setCertificateDisplay(certBase64)
      } else {
        console.error('Failed to access invitationPackage.')
      }
    } catch (error) {
      console.error('Error generating workspace certificate:', error)
      setCertificateDisplay('Failed to generate workspace certificate. Check console for details.')
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
    <div class={styles.workspaceCreationPage}>
      <h1 class={styles.pageTitle}>Create New Workspace</h1>
      <div class={styles.formContainer}>
        <label class={styles.label}>Workspace Name</label>
        <input
          type="text"
          class={styles.inputField}
          value={workspaceName()}
          onInput={(e) => setWorkspaceName(e.currentTarget.value)}
          placeholder="Enter workspace name"
        />

        <label class={styles.label}>X.509 Certificate</label>
        <input
          type="text"
          class={styles.inputField}
          value={x509Certificate()}
          onInput={(e) => setX509Certificate(e.currentTarget.value)}
          placeholder="Enter X.509 certificate"
        />

        <label class={styles.label}>X.509 Private Key</label>
        <input
          type="text"
          class={styles.inputField}
          value={x509PrivateKey()}
          onInput={(e) => setX509PrivateKey(e.currentTarget.value)}
          placeholder="Enter X.509 private key"
        />

        <label class={styles.label}>Domain Name</label>
        <input
          type="text"
          class={styles.inputField}
          value={domainName()}
          onInput={(e) => setDomainName(e.currentTarget.value)}
          placeholder="Enter domain name"
        />

        <div class={styles.toggleContainer}>
          <span class={styles.toggleLabel}>Initiator Only</span>
          <label class={styles.switch}>
            <input type="checkbox" checked={isInitiator()} onChange={() => setIsInitiator(!isInitiator())} />
            <span class={styles.slider}></span>
          </label>
          <span class={styles.toggleLabel}>Web-of-Trust</span>
        </div>

        <button class={styles.submitButton} disabled={!isButtonEnabled()} onClick={handleSubmit}>
          Create Workspace
        </button>

        {certificateDisplay() && (
          <div class={styles.certificateDisplayContainer}>
            <h3>Generated Workspace Certificate</h3>
            <textarea
              readOnly
              class={styles.certificateDisplay}
              value={certificateDisplay()}
              rows={5}
              cols={80}
              style={{ width: '100%' }}
            />
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

export default WorkspaceCreationPage
