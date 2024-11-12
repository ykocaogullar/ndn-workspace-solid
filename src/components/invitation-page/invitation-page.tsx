import { createSignal } from 'solid-js'
import styles from './styles.module.scss'
import { invitationPackage } from '../../backend/main'
import { Decoder, Encoder } from '@ndn/tlv'
import { Data } from '@ndn/packet'
import { Certificate } from '@ndn/keychain'
import { base64ToBytes, bytesToBase64 } from '../../utils'
import { InvitationData } from '@ucla-irl/ndnts-aux/security'
import { useNdnWorkspace } from '../../Context'
import toast from 'solid-toast'

const InvitationPage = () => {
  const [invitee, setInvitee] = createSignal('')
  const [serializedInvitation, setSerializedInvitation] = createSignal('')
  const [receivedInvitation, setReceivedInvitation] = createSignal('')
  const [invitationDataObject, setInvitationDataObject] = createSignal<InvitationData | null>(null)
  const [copySuccess, setCopySuccess] = createSignal('')
  const { bootstrapWorkspace } = useNdnWorkspace()! // Access workspace functions

  // Function to create invitation data
  const handleCreateInvitation = async () => {
    try {
      if (!invitationPackage) {
        throw new Error('invitationPackage is not initialized')
      }

      const inviteeCertBase64 = invitee()
      const inviteeCertBytes = base64ToBytes(inviteeCertBase64)
      const decodedData = Decoder.decode(inviteeCertBytes, Data)
      const inviteeCert = Certificate.fromData(decodedData)

      const invitationData = invitationPackage.createInvitation(inviteeCert)

      const invitationDataCopy = {
        ...invitationData,
        workspaceCert: {
          ...invitationData.workspaceCert,
          data: bytesToBase64(Encoder.encode(invitationData.workspaceCert.data)),
        },
        inviteeCert: {
          ...invitationData.inviteeCert,
          data: bytesToBase64(Encoder.encode(invitationData.inviteeCert.data)),
        },
      }

      const serializedInvitationData = JSON.stringify(invitationDataCopy, null, 2)
      const base64SerializedInvitationData = bytesToBase64(new TextEncoder().encode(serializedInvitationData))

      setSerializedInvitation(base64SerializedInvitationData)
    } catch (error) {
      console.error('Error creating invitation:', error)
    }
  }

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(serializedInvitation())
      setCopySuccess('Copied to clipboard!')
      setTimeout(() => setCopySuccess(''), 2000)
    } catch (error) {
      setCopySuccess('Failed to copy')
    }
  }

  // Function to decode received base64 invitation data and install workspaceCert
  const handleDecodeInvitation = async () => {
    try {
      const base64EncodedInput = receivedInvitation()
      const jsonText = new TextDecoder().decode(base64ToBytes(base64EncodedInput))
      const parsedData = JSON.parse(jsonText)

      // Decode workspaceCert and inviteeCert back into Certificate objects
      const workspaceCertData = base64ToBytes(parsedData.workspaceCert.data)
      const inviteeCertData = base64ToBytes(parsedData.inviteeCert.data)
      const workspaceCert = Certificate.fromData(Decoder.decode(workspaceCertData, Data))
      const inviteeCert = Certificate.fromData(Decoder.decode(inviteeCertData, Data))

      // Set decoded data in the state
      const invitationData: InvitationData = { workspaceCert, inviteeCert }
      setInvitationDataObject(invitationData)

      // Check if invitationPackage is defined before accessing its methods
      if (!invitationPackage) {
        console.error('invitationPackage is undefined.')
        toast.error('Invitation package is not initialized.')
        return
      }

      // Retrieve the private key as Uint8Array from invitationPackage
      const privateKey = await invitationPackage.getPrivateKey()

      if (!privateKey) {
        console.error('Private key not set in InvitationPackage.')
        toast.error('Private key is not available for bootstrapping.')
        return
      }

      // Attempt to bootstrap the workspace with workspaceCert as the trust anchor
      await bootstrapWorkspace({
        trustAnchor: workspaceCert,
        ownCertificate: inviteeCert,
        prvKey: privateKey, // Use the retrieved private key here
      })

      console.log('Successfully installed workspaceCert as trust anchor')
      toast.success('Successfully installed workspace certificate!')
    } catch (error) {
      console.error('Error decoding or installing invitation data:', error)
      toast.error('Failed to decode or install workspace certificate.')
    }
  }

  return (
    <div class={styles.invitationPage}>
      <h1 class={styles.pageTitle}>Create and Decode Invitation</h1>
      <div class={styles.formContainer}>
        <label for="inviteeInput" class={styles.label}>
          Enter Invitee Information:
        </label>
        <input
          id="inviteeInput"
          type="text"
          class={styles.inputField}
          value={invitee()}
          onInput={(e) => setInvitee(e.currentTarget.value)}
        />
        <button class={styles.createButton} onClick={handleCreateInvitation}>
          Create Invitation
        </button>

        {serializedInvitation() && (
          <div class={styles.serializedOutput}>
            <h2>Serialized Invitation (Base64 Encoded):</h2>
            <textarea
              readOnly
              class={styles.serializedTextArea}
              value={serializedInvitation()}
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

        <h2>Decode Received Invitation</h2>
        <textarea
          placeholder="Paste received base64 invitation data here"
          class={styles.inputTextArea}
          value={receivedInvitation()}
          onInput={(e) => setReceivedInvitation(e.currentTarget.value)}
          rows={5}
          cols={80}
          style={{ width: '100%' }}
        />
        <button class={styles.decodeButton} onClick={handleDecodeInvitation}>
          Decode Invitation
        </button>

        {invitationDataObject() && (
          <div class={styles.decodedOutput}>
            <h3>Decoded Invitation Data:</h3>
            <pre>{JSON.stringify(invitationDataObject(), null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default InvitationPage
